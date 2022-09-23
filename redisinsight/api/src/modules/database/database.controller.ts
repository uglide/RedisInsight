import { Controller, Get, Param } from '@nestjs/common';
import { DatabaseService } from 'src/modules/database/database.service';
import { Database } from 'src/modules/database/models/database';
import { ApiTags } from '@nestjs/swagger';
import { ApiEndpoint } from 'src/decorators/api-endpoint.decorator';

@ApiTags('1POC Databases')
@Controller('databases')
export class DatabaseController {
  constructor(
    private readonly service: DatabaseService,
  ) {}

  @ApiEndpoint({
    description: 'Returns database model',
    statusCode: 200,
    responses: [
      {
        status: 200,
        type: Database,
      },
    ],
  })
  @Get(':id')
  async get(
    @Param('id') id: string,
  ): Promise<Database> {
    return this.service.get(id);
  }

  @ApiEndpoint({
    description: 'Returns list of databases',
    statusCode: 200,
    responses: [
      {
        status: 200,
        isArray: true,
        type: Database,
      },
    ],
  })
  @Get()
  async list(): Promise<Database[]> {
    return this.service.list();
  }
}
