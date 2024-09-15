import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  CurrentUser,
  JwtAuthGuard,
} from '@ubs-platform/users-mona-microservice-helper';
import { CommentDTO } from 'libs/common/src';
import { CommentService } from '../service/comment.service';
import { UserAuthBackendDTO } from '@ubs-platform/users-common';

@Controller()
export class CommentController {
  constructor(private commentService: CommentService) {}
  @Post('comment')
  @UseGuards(JwtAuthGuard)
  addComment(
    @Body() comment: CommentDTO,
    @CurrentUser() user: UserAuthBackendDTO
  ) {
    this.commentService.insertComment(comment, user);
  }
}
