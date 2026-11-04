import { Controller, Get, Post, Patch, Delete, Param, Body, Query } from '@nestjs/common';
import { MenuService } from './menu.service';

@Controller('menu')
export class MenuController {
  constructor(private menuService: MenuService) {}

  @Get('categories')
  async getCategories() {
    return this.menuService.getCategories();
  }

  @Get('items')
  async getItems(@Query('categoryId') categoryId?: string) {
    return this.menuService.getMenuItems(categoryId);
  }

  @Post('items')
  async createMenuItem(
    @Body()
    body: {
      name: string;
      categoryId: string;
      price: number;
      description?: string;
      prepSection?: string;
      isDirectSale?: boolean;
      imageUrl?: string;
    },
  ) {
    return this.menuService.createMenuItem(body);
  }

  @Patch('items/:id')
  async updateMenuItem(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      categoryId?: string;
      price?: number;
      description?: string;
      prepSection?: string;
      isDirectSale?: boolean;
      imageUrl?: string;
      isAvailable?: boolean;
    },
  ) {
    return this.menuService.updateMenuItem(id, body);
  }

  @Delete('items/:id')
  async deleteMenuItem(@Param('id') id: string) {
    return this.menuService.deleteMenuItem(id);
  }

  @Get('tables')
  async getTables() {
    return this.menuService.getTables();
  }

  @Post('tables')
  async createTable(
    @Body() body: { tableNumber: string; capacity?: number; status?: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' },
  ) {
    return this.menuService.createTable(body);
  }

  @Patch('tables/:id')
  async updateTable(
    @Param('id') id: string,
    @Body() body: { tableNumber?: string; capacity?: number; status?: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED' },
  ) {
    return this.menuService.updateTable(id, body);
  }

  @Delete('tables/:id')
  async deleteTable(@Param('id') id: string) {
    return this.menuService.deleteTable(id);
  }
}
