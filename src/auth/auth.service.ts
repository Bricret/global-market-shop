import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt'


import { CommonService } from 'src/common/common.service';
import { CreateUserDto, LoginUserDto } from './dto';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { User } from './entities/user.entity';


@Injectable()
export class AuthService {

  constructor(

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly commonService: CommonService,

    private readonly jwtService: JwtService,

  ) {}


  async create( createUserDto: CreateUserDto) {

    try {

      const { password,  ...userData } = createUserDto;
      
      const user = this.userRepository.create({
        ...userData,
        password: bcrypt.hashSync( password, 10 )
      });
      await this.userRepository.save( user );
      delete user.password;

      return {
        ...user,
        token: this.getJwToken({ id: user.id })
      };

    } catch (error) {
      this.commonService.handleExceptions(error.detail, 'BR');
    }

  }

  async loginUser( loginUserDto: LoginUserDto ) {

    const { email, password } = loginUserDto;

    const user = await this.userRepository.findOne({
      where: { email },
      select: { email: true, password: true, id: true }
    });

    if ( !user ) this.commonService.handleExceptions( 'Credential are not valid (email)', 'UE' );

    if ( !bcrypt.compareSync( password, user.password ) ) {
      this.commonService.handleExceptions( 'Credential are not valid (password)', 'UE' );
    }

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { businesses, ...rest } = user;

    return {
      ...rest,
      token: this.getJwToken({ id: user.id })
    }
  }
  
  async checkAuthStatus( user: User ) {

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      token: this.getJwToken({ id: user.id })
    }
    
  }
  
  private getJwToken( payload: JwtPayload ) {

    const token = this.jwtService.sign( payload );
    return token;

  }

}
