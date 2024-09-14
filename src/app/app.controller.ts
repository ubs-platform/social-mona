import { Controller, Get, Inject, Post, UseGuards } from '@nestjs/common';

import { AppService } from './app.service';
import { Roles, RolesGuard } from '@ubs-platform/users-mona-roles';
import { JwtAuthGuard } from '@ubs-platform/users-mona-microservice-helper';
import { BaseSimpleControllerBuilder } from './controller/base/base-simple.controller';
import { ClientKafka } from '@nestjs/microservices';
import { lastValueFrom } from 'rxjs';

const kafkef =
  '\n' +
  '                                                                               \n' +
  '                                     .:=##%+#*.+=-..                                      \n' +
  '                                  .:=%@@@@@@@@*+@%#%#=:.                                  \n' +
  '                                 -*%@@@@@@@@@@@%%@@@@@@*+-                                \n' +
  '                               :+%@@@@@@@@@@@@@@@@@@@@@@%%*:                              \n' +
  '                            ..=%@@@@@@@@@@@@@@@@@@@@@@@@@@%*                              \n' +
  '                             :*%@@@@@@@@@@@@@@@@@@#+=+++=+++-                             \n' +
  '                             -+==-..   .*%@@@@@@@%*::--==-..=:                            \n' +
  '                            .:  .=+**+#%@@@@@@@@@@@@@@@@@@@* :   .                        \n' +
  '                           ....=%@@@@@@@@@@@@@@@@@@%%*+*#%@@#:. .                         \n' +
  '                           .:.#@@%*+--*%%@@@@@@@@@%@@+=#*-+@@#-                           \n' +
  '                           ..+@@%=#@*#@@@@@@@@@@@@@@@@@@@@@@@@#                           \n' +
  '                           .=@@@@@@@@@@@@@@%@@@@@@@@@@@@@@@@@@%-                          \n' +
  '                           :+%@@@@@@@@@@@@*@@@@@@@@@@@@@@@@@@@@+ *:                       \n' +
  '                       :*:  +@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@* #+                       \n' +
  '                       +@=  *@@@@@@@@@@@@@@**#%#+%@@@@@@@@@@@@@= %@                       \n' +
  '                       +@@  =@@@@@@@@@@@#+-::*%+.::+%@@@@@@@@@@:.@#                       \n' +
  '                       -@@: .%@@@@@@@%=::=-=*+#+%#*=:.-+@@@@@@% +@=                       \n' +
  '                        *@=  #@@@@@@- -=@@@@@@@@@@@@@#. .%@@@@# %#.                       \n' +
  '                         +%  *@@@@@*=#@@###%%@%@%@%##%@#-#@@@@+ ++                        \n' +
  '                         :=  +@@@@#+%@@@@@@@@@%@@@@@@@@@*#@@@@=                           \n' +
  '                             :@@@%=.*@@@@@*.:    -+@@@@@:*@@@*.                           \n' +
  '                              =%@@:.+#@@@@@*.  . :*@@%*+ :#+.                             \n' +
  '                               ..:   ::+++*+-: ===++--.                                   \n' +
  '                                        . :=**:::=:                                       \n' +
  '                                           . ..                                           \n' +
  '                             .                                                            \n' +
  '                            :.                                                            \n' +
  '                            :-===:             .      :+*=*                               \n' +
  '                            .#@@@##+--=--===+%#-+:..:-%@@@#                               \n' +
  '                            .#@%@@@@%@@@@@@@@@%%##*+@@@@@@=                               \n' +
  '                             *@@@@@@@@@@@@@@@@@@@@@@@@@@@%=-                              \n' +
  '                           . +%@@@@@@@@@@@@@@@@@@@@@@@@@@++.                              \n' +
  '                           :.+%@@@@@@@@@@@@@@@@@@@@@@@@@%=.                               \n' +
  '                             +%@@@@@@@@@@@@@@@@@@@@@@@@@#.                                \n' +
  '                             .*@@@@@@@@@@@@@@@@@@@@@@@%=                                  \n' +
  '                               .=#@@@@@@@@@@@@@@@@%*+:                                    \n' +
  '                                  .-+*#%%%%%##*=-:       \n' +
  ' #####     ###     #####    #####   ####       ###     #####    ######  ##   ##  \n' +
  '##   ##   ## ##   ##   ##  ### ###   ##       ## ##   ##   ##     ##    ###  ##  \n' +
  '##       ##   ##  ##       ##   ##   ##      ##   ##  ##          ##    #### ##  \n' +
  ' #####   ##   ##  ## ####  ##   ##   ##      ##   ##   #####      ##    #######  \n' +
  '     ##  #######  ##   ##  ##   ##   ##      #######       ##     ##    ## ####  \n' +
  '##   ##  ##   ##  ##   ##  ### ###   ##  ##  ##   ##  ##   ##     ##    ##  ###  \n' +
  ' #####   ##   ##   #####    #####   #######  ##   ##   #####    ######  ##   ##  \n' +
  '                                                                                 \n' +
  '  \n';
@Controller()
export class AppController extends BaseSimpleControllerBuilder(true, kafkef) {
  // constructor(private readonly appService: AppService) {}
  // @Get()
  // @Roles(['ADMIN'])
  // @UseGuards(JwtAuthGuard, RolesGuard)
  // getData() {
  //   return this.appService.getData();
  // }

  constructor(@Inject('KafkaClient') public kafkaClient: ClientKafka) {
    super();
  }

  @Post('insert-ownership')
  async insertOwnership() {
    debugger;
    await lastValueFrom(
      this.kafkaClient.emit('insert-ownership', {
        userCapabilities: [
          {
            userId: '12121212',
            capability: 'OWNERSHIP',
          },
        ],
        entityGroup: 'social',
        entityName: 'comment',
        entityId: '123123123',
        fileUploadMaxLengthBytes: '123123123',
        fileUploadAllowedFormats: [],
        overriderRoles: [],
      })
    );
  }
}
