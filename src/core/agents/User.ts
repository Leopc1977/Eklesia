import Agent from "./Agent";
import Provider from "../../providers";

export default class User extends Agent {
  constructor(
    provider: Provider,
  ) {
    super("user", "", provider);
  }
}
