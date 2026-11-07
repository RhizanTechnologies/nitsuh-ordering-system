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

  @Post('items/:id/recipe')
  async saveItemRecipe(
    @Param('id') id: string,
    @Body()
    body: {
      yieldPortions?: number;
      ingredients?: { ingredientId: string; quantity: number; unitId?: string }[];
      ingredientsList?: { ingredientId: string; quantity: number; unitId?: string }[];
    },
  ) {
    const list = body.ingredients || body.ingredientsList || [];
    return this.menuService.saveRecipe(id, body.yieldPortions || 1, list);
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

  // --- ADD-ONS ENDPOINTS ---
  @Get('addons')
  async getAddons() {
    return this.menuService.getAllAddons();
  }

  @Post('addons')
  async createAddon(
    @Body()
    body: {
      name: string;
      price: number;
      ingredientId?: string;
      quantity?: number;
      unitId?: string;
      categoryId?: string;
      menuItemId?: string;
    },
  ) {
    return this.menuService.createAddon(body);
  }

  @Patch('addons/:id')
  async updateAddon(
    @Param('id') id: string,
    @Body()
    body: {
      name?: string;
      price?: number;
      ingredientId?: string | null;
      quantity?: number;
      unitId?: string | null;
      categoryId?: string | null;
      menuItemId?: string | null;
      isActive?: boolean;
    },
  ) {
    return this.menuService.updateAddon(id, body);
  }

  @Delete('addons/:id')
  async deleteAddon(@Param('id') id: string) {
    return this.menuService.deleteAddon(id);
  }
}
