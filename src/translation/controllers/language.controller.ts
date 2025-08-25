import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpStatus,
  HttpCode,
  ValidationPipe,
} from "@nestjs/common"
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from "@nestjs/swagger"
import type { TranslationService } from "../services/translation.service"
import type { Language } from "../entities"
import type { CreateLanguageDto, UpdateLanguageDto } from "../dto"

@ApiTags("languages")
@Controller("languages")
export class LanguageController {
  constructor(private readonly translationService: TranslationService) {}

  @Post()
  @ApiOperation({ summary: "Create a new language" })
  @ApiResponse({ status: 201, description: "Language created successfully" })
  @ApiResponse({ status: 409, description: "Language already exists" })
  async create(createLanguageDto: CreateLanguageDto): Promise<Language> {
    return this.translationService.createLanguage(createLanguageDto)
  }

  @Get()
  @ApiOperation({ summary: "Get all languages" })
  @ApiQuery({ name: "activeOnly", required: false, type: Boolean, description: "Filter active languages only" })
  @ApiResponse({ status: 200, description: "Languages retrieved successfully" })
  async findAll(@Query("activeOnly") activeOnly?: boolean): Promise<Language[]> {
    return this.translationService.findAllLanguages(activeOnly)
  }

  @Get(":code")
  @ApiOperation({ summary: "Get language by code" })
  @ApiParam({ name: "code", description: "Language code (e.g., en, es, fr)" })
  @ApiResponse({ status: 200, description: "Language retrieved successfully" })
  @ApiResponse({ status: 404, description: "Language not found" })
  async findByCode(@Param("code") code: string): Promise<Language> {
    return this.translationService.findLanguageByCode(code)
  }

  @Put(":id")
  @ApiOperation({ summary: "Update a language" })
  @ApiParam({ name: "id", description: "Language ID" })
  @ApiResponse({ status: 200, description: "Language updated successfully" })
  @ApiResponse({ status: 404, description: "Language not found" })
  async update(
    @Param("id", ParseIntPipe) id: number,
    @Body(ValidationPipe) updateLanguageDto: UpdateLanguageDto,
  ): Promise<Language> {
    return this.translationService.updateLanguage(id, updateLanguageDto)
  }

  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Delete a language" })
  @ApiParam({ name: "id", description: "Language ID" })
  @ApiResponse({ status: 204, description: "Language deleted successfully" })
  @ApiResponse({ status: 404, description: "Language not found" })
  @ApiResponse({ status: 400, description: "Cannot delete default language" })
  async remove(@Param("id", ParseIntPipe) id: number): Promise<void> {
    return this.translationService.deleteLanguage(id)
  }
}
