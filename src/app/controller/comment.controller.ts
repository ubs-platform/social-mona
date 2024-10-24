import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  CurrentUser,
  JwtAuthGuard,
} from '@ubs-platform/users-mona-microservice-helper';
import {
  CommentAbilityDTO,
  CommentAddDTO,
  CommentEditDTO,
  CommentSearchDTO,
} from 'libs/common/src';
import { CommentService } from '../service/comment.service';
import { UserAuthBackendDTO } from '@ubs-platform/users-common';
import { UserIntercept } from '../guard/UserIntercept';

@Controller('comment')
export class CommentController {
  constructor(private commentService: CommentService) {}
  @Post()
  @UseGuards(JwtAuthGuard)
  async addComment(
    @Body() comment: CommentAddDTO,
    @CurrentUser() user: UserAuthBackendDTO
  ) {
    return await this.commentService.insertComment(comment, user);
  }

  @Get()
  @UseGuards(UserIntercept)
  async fetchComments(
    @Query() comment: CommentSearchDTO,
    @CurrentUser() currentUser
  ) {
    console.info(currentUser);
    return await this.commentService.searchComments(comment);
  }

  @Get('ability')
  @UseGuards(UserIntercept)
  async canComment(
    @Query() comment: CommentSearchDTO,
    @CurrentUser() currentUser
  ): Promise<CommentAbilityDTO> {
    return await this.commentService.checkAbilities(comment, currentUser);
  }

  @Delete(':id')
  @UseGuards(UserIntercept)
  async deleteComment(
    @Param('id') id: string,
    @CurrentUser() currentUser
  ): Promise<void> {
    await this.commentService.deleteComment(id, currentUser);
  }

  @Put(':id')
  @UseGuards(UserIntercept)
  async editComment(
    @Param('id') id: string,
    @CurrentUser() currentUser,
    @Body() newCommetn: CommentEditDTO
  ): Promise<void> {
    return await this.commentService.editComment(id, newCommetn, currentUser);
  }
}
