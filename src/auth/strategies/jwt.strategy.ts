import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { User } from "../entities/user.entity";
import { JwtPayload } from "../interfaces/jwt-payload.interface";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ConfigService } from "@nestjs/config";
import { CommonService } from "src/common/common.service";
import { Injectable } from "@nestjs/common";


@Injectable()
export class JwtStrategy extends PassportStrategy( Strategy ) {


    constructor(

        @InjectRepository( User )
        private readonly userRepository: Repository<User>,

        configService: ConfigService,

        private readonly commonService: CommonService
    ) {
        super({
            secretOrKey: configService.get( 'JWT_SECRET' ),
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken()
        })
    }


    async validate( payload: JwtPayload ): Promise<User> {

        const { email } = payload;

        const user = await this.userRepository.findOneBy({ email });

        if ( !user ) this.commonService.handleExceptions( 'Token not valid', 'UE' );

        if ( !user.is_active ) this.commonService.handleExceptions( 'User is inactive, talk with an admin', 'UE' );

        return ;
    }

}