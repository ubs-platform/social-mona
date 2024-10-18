import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import {
  CurrentUser,
  JwtAuthGuard,
} from '@ubs-platform/users-mona-microservice-helper';
import { CommentAddDTO, CommentSearchDTO } from 'libs/common/src';
import { CommentService } from '../service/comment.service';
import { UserAuthBackendDTO } from '@ubs-platform/users-common';

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
  @UseGuards(JwtAuthGuard)
  async fetchComments(@Query() comment: CommentSearchDTO) {
    return await this.commentService.searchComments(comment);
  }
}
