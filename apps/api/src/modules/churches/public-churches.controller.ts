import { Controller, Get, Param, ParseUUIDPipe } from "@nestjs/common";

import { ChurchesService } from "./churches.service";

@Controller("churches")
export class PublicChurchesController {
  constructor(private readonly service: ChurchesService) {}

  /**
   * Listado público.
   * Devuelve TODAS las iglesias, pero las inactivas sólo exponen
   * { id, name, isActive, timestamps } (el filtrado ocurre en el service).
   */
  @Get()
  findAllPublic() {
    return this.service.findAllPublic();
  }

  /**
   * Detalle público.
   * Sólo responde con iglesias activas; inactivas → 404.
   */
  @Get(":id")
  findOnePublic(@Param("id", new ParseUUIDPipe({ version: "4" })) id: string) {
    return this.service.findOnePublic(id);
  }
}
