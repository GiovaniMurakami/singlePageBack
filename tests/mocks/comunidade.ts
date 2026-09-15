import { ComunidadeGateway } from "../../src/dominio/gateway/comunidadeGateway";

export function criarMockComunidadeGateway(overrides: Partial<ComunidadeGateway> = {}): ComunidadeGateway {
  return {
    listarPublicadas: jest.fn().mockResolvedValue([]),
    obterTotaisCurtidas: jest.fn().mockResolvedValue({}),
    listarCurtidasDoUsuario: jest.fn().mockResolvedValue(new Set()),
    curtiu: jest.fn().mockResolvedValue(false),
    curtir: jest.fn().mockResolvedValue(1),
    descurtir: jest.fn().mockResolvedValue(0),
    ...overrides,
  };
}
