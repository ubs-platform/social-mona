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
  CommentAbilityDTO as CommentingAbilityDTO,
  CommentAddDTO,
  CommentEditDTO,
  CommentSearchDTO,
  CanManuplateComment,
  ExistCommentAbilityDTO,
  CommentDTO,
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
    @CurrentUser() currentUser : UserAuthBackendDTO
  ) {
    console.info(currentUser);
    return await this.commentService.searchComments(comment, currentUser);
  }

  @Get('ability')
  @UseGuards(UserIntercept)
  async canComment(
    @Query() comment: CommentSearchDTO,
    @CurrentUser() currentUser
  ): Promise<CommentingAbilityDTO> {
    return await this.commentService.checkCommentingAbilities(
      comment,
      currentUser
    );
  }

  @Get(':id/ability')
  @UseGuards(UserIntercept)
  async canExistCommentAbility(
    @Param('id') commentId: string,
    @CurrentUser() currentUser
  ): Promise<ExistCommentAbilityDTO> {
    return {
      canRemove: (
        await this.commentService.checkCanDelete(commentId, currentUser)
      ).allow,
      canEdit: (await this.commentService.checkCanEdit(commentId, currentUser))
        .allow,
    };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async deleteComment(
    @Param('id') id: string,
    @CurrentUser() currentUser
  ): Promise<void> {
    await this.commentService.deleteComment(id, currentUser);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async editComment(
    @Param('id') id: string,
    @CurrentUser() currentUser,
    @Body() newCommetn: CommentEditDTO
  ): Promise<CommentDTO> {
    return await this.commentService.editComment(id, newCommetn, currentUser);
  }

  @Put(':id/upvote')
  @UseGuards(JwtAuthGuard)
  async upvote(
    @Param('id') id: string,
    @CurrentUser() currentUser,
  ): Promise<CommentDTO> {
    return await this.commentService.voteComment(id, currentUser, "UP");
  }

  @Put(':id/downvote')
  @UseGuards(JwtAuthGuard)
  async downvote(
    @Param('id') id: string,
    @CurrentUser() currentUser,
  ): Promise<CommentDTO> {
    return await this.commentService.voteComment(id, currentUser, "DOWN");
  }
}
