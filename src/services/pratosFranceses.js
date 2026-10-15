import { buscarPratosDetalhados } from "./cardapio.js";

export function buscarPratosFranceses(signal) {
  return buscarPratosDetalhados({ signal });
}
