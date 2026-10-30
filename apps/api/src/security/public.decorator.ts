import { SetMetadata } from "@nestjs/common";
import { PUBLIC_ROUTE_KEY } from "./authorization.constants.js";

export const Public = () => SetMetadata(PUBLIC_ROUTE_KEY, true);
