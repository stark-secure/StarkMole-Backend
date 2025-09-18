import { ApiPropertyOptional } from "@nestjs/swagger"
import { Type } from "class-transformer"
import { IsOptional, IsPositive, Max, Min } from "class-validator"

export class PaginationDto {
  @ApiPropertyOptional({
    description: "Page number (1-based)",
    minimum: 1,
    default: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  @Min(1)
  page?: number = 1

  @ApiPropertyOptional({
    description: "Number of items per page",
    minimum: 1,
    maximum: 100,
    default: 10,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsPositive()
  @Min(1)
  @Max(100)
  limit?: number = 10
}

export class PaginationMetaDto {
  @ApiPropertyOptional({
    description: "Total number of items",
    example: 100,
  })
  total: number

  @ApiPropertyOptional({
    description: "Current page number",
    example: 1,
  })
  page: number

  @ApiPropertyOptional({
    description: "Number of items per page",
    example: 10,
  })
  limit: number

  @ApiPropertyOptional({
    description: "Total number of pages",
    example: 10,
  })
  totalPages: number
}

export class PaginatedResponseDto<T> {
  data: T[]
  meta: PaginationMetaDto
}
