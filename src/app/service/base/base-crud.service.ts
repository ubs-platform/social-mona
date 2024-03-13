import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, HydratedDocument, Model, ObjectId } from 'mongoose';
import { SearchResult } from 'src/app/dto/base/search-result.dto';
export interface IBaseCrudService<
  MODEL,
  INPUT extends { _id },
  OUTPUT,
  SEARCH
> {
  toOutput(m: MODEL): Promise<OUTPUT> | OUTPUT;
  moveIntoModel(model: MODEL, i: INPUT): Promise<MODEL> | MODEL;
  searchParams(s?: SEARCH): FilterQuery<MODEL>;

  fetchAll(s?: SEARCH): Promise<OUTPUT[]>;
  searchPagination(
    s?: SEARCH & { page?: number; size?: number }
  ): Promise<SearchResult<OUTPUT>>;
  fetchOne(id: string | ObjectId): Promise<OUTPUT>;
  create(input: INPUT): Promise<OUTPUT>;
  edit(input: INPUT): Promise<OUTPUT>;
  remove(id: string | ObjectId): Promise<OUTPUT>;
}

export const BaseCrudServiceGenerate = <
  MODEL,
  INPUT extends { _id },
  OUTPUT,
  SEARCH
>(
  modelName: string
) => {
  abstract class BaseCrudService {
    constructor(@InjectModel(modelName) private m: Model<MODEL>) {}

    abstract toOutput(m: MODEL): Promise<OUTPUT> | OUTPUT;
    abstract moveIntoModel(model: MODEL, i: INPUT): Promise<MODEL> | MODEL;
    abstract searchParams(s?: SEARCH): FilterQuery<MODEL>;

    private async fetchFilteredAndPaginated(
      s: SEARCH & { page?: number; size?: number }
    ) {
      const results = await this.m.aggregate([
        {
          $facet: {
            total: [{ $count: 'total' }],
            data: [
              { $skip: s.size * s.page },
              // lack of convert to int
              { $limit: parseInt(s.size as any as string) },
              { $sort: { _id: 1 } },
            ],
          },
        },
      ]);

      const maxItemLength = results[0].total[0].count;
      const list = results[0].data;
      return { list, maxItemLength };
    }

    private async convertAndReturnTheList(
      list: HydratedDocument<MODEL, {}, {}>[]
    ) {
      const outputList = [];
      for (let index = 0; index < list.length; index++) {
        const item = list[index];
        outputList.push(await this.toOutput(item));
      }
      return outputList;
    }

    async searchResult(
      modelList: HydratedDocument<MODEL, {}, {}>[],
      page: number,
      size: number,
      maxItemLength: number
    ): Promise<SearchResult<OUTPUT>> {
      const itemLengthThing = Math.ceil(maxItemLength / size);
      const maxPagesIndex = size ? itemLengthThing - 1 : 0;
      return {
        content: await this.convertAndReturnTheList(modelList),
        page,
        size,
        maxItemLength,
        maxPagesIndex,
        lastPage: maxPagesIndex <= page,
        firstPage: page == 0,
      };
    }

    async searchPagination(
      s?: SEARCH & { page?: number; size?: number }
    ): Promise<SearchResult<OUTPUT>> {
      if (s) {
        if (s.page == null) s.page = 0;
        if (s.size == null) s.size = 10;
      }

      const { list, maxItemLength } = await this.fetchFilteredAndPaginated(s);
      // const maxItemLength = await this.m
      //   .find(this.searchParams(s))
      //   .count()
      //   .exec();
      // const list = await this.m
      //   .find(this.searchParams(s))
      //   .limit(s.size)
      //   .skip(s.size * s.page)
      //   .exec();
      return this.searchResult(list, s.page, s.size, maxItemLength);
    }

    async fetchAll(s?: SEARCH): Promise<OUTPUT[]> {
      const list = await this.m.find(this.searchParams(s)).exec();
      return await this.convertAndReturnTheList(list);
    }

    async fetchOne(id: string | ObjectId): Promise<OUTPUT> {
      return this.toOutput(await this.m.findById(id));
    }

    async create(input: INPUT): Promise<OUTPUT> {
      let newModel = new this.m();

      newModel = (await this.moveIntoModel(
        newModel,
        input
      )) as HydratedDocument<MODEL, {}, unknown>;

      await (newModel as HydratedDocument<MODEL, {}, unknown>).save();

      return this.toOutput(newModel);
    }

    async edit(input: INPUT): Promise<OUTPUT> {
      let newModel = await this.m.findById(input._id);

      newModel = (await this.moveIntoModel(
        newModel,
        input
      )) as HydratedDocument<MODEL, {}, unknown>;

      await (newModel as HydratedDocument<MODEL, {}, unknown>).save();

      return this.toOutput(newModel);
    }

    async remove(id: string | ObjectId): Promise<OUTPUT> {
      let ac = await this.m.findById(id);
      ac = (await ac.remove()) as HydratedDocument<MODEL, {}, {}>;
      return this.toOutput(ac);
    }
  }

  return BaseCrudService;
};
