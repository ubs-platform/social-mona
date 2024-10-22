import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import {
  CurrentUser,
  JwtAuthGuard,
} from '@ubs-platform/users-mona-microservice-helper';
import {
  CommentAbilityDTO,
  CommentAddDTO,
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
    if (currentUser) {
      return {
        userCanComment: true,
        userCommentBlockReason: '',
      };
    } else {
      return {
        userCanComment: false,
        userCommentBlockReason:
          'mona.comments.userCommentBlockReason.not-logged',
      };
    }
    // console.info(currentUser);
    // return await this.commentService.searchComments(comment);
  }
}
