import { applyDecorators, type Type } from "@nestjs/common"
import { ApiResponse, getSchemaPath } from "@nestjs/swagger"

export const ApiResponseDto = <TModel extends Type<any>>(model: TModel, status = 200, description?: string) => {
  return applyDecorators(
    ApiResponse({
      status,
      description: description || `Returns ${model.name}`,
      schema: {
        $ref: getSchemaPath(model),
      },
    }),
  )
}

export const ApiPaginatedResponse = <TModel extends Type<any>>(model: TModel) => {
  return applyDecorators(
    ApiResponse({
      status: 200,
      description: `Paginated list of ${model.name}`,
      schema: {
        allOf: [
          {
            properties: {
              data: {
                type: "array",
                items: { $ref: getSchemaPath(model) },
              },
              meta: {
                type: "object",
                properties: {
                  total: { type: "number" },
                  page: { type: "number" },
                  limit: { type: "number" },
                  totalPages: { type: "number" },
                },
              },
            },
          },
        ],
      },
    }),
  )
}
