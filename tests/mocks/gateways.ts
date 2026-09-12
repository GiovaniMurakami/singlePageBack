import { UsuarioGateway } from "../../src/dominio/gateway/usuarioGateway";
import { PaginaGateway } from "../../src/dominio/gateway/paginaGateway";
import { RefreshTokenGateway } from "../../src/dominio/gateway/refreshTokenGateway";
import { TokenBlacklistGateway } from "../../src/dominio/gateway/tokenBlacklistGateway";
import { ImagemGateway } from "../../src/dominio/gateway/imagemGateway";
import { StripeGateway } from "../../src/dominio/gateway/stripeGateway";

export function criarMockUsuarioGateway(overrides: Partial<UsuarioGateway> = {}): UsuarioGateway {
  return {
    salvar: jest.fn(),
    buscarPorEmail: jest.fn().mockResolvedValue(null),
    buscarPorId: jest.fn().mockResolvedValue(null),
    buscarPorStripeCustomerId: jest.fn().mockResolvedValue(null),
    atualizar: jest.fn(),
    ...overrides,
  };
}

export function criarMockPaginaGateway(overrides: Partial<PaginaGateway> = {}): PaginaGateway {
  return {
    salvar: jest.fn(),
    buscarPorId: jest.fn().mockResolvedValue(null),
    buscarPorSlug: jest.fn().mockResolvedValue(null),
    listarPorUsuario: jest.fn().mockResolvedValue([]),
    contarPorUsuario: jest.fn().mockResolvedValue(0),
    atualizar: jest.fn(),
    excluir: jest.fn(),
    ...overrides,
  };
}

export function criarMockRefreshTokenGateway(overrides: Partial<RefreshTokenGateway> = {}): RefreshTokenGateway {
  return {
    salvar: jest.fn(),
    consumir: jest.fn().mockResolvedValue(null),
    excluirPorUsuario: jest.fn(),
    ...overrides,
  };
}

export function criarMockTokenBlacklistGateway(overrides: Partial<TokenBlacklistGateway> = {}): TokenBlacklistGateway {
  return {
    adicionar: jest.fn(),
    existe: jest.fn().mockResolvedValue(false),
    ...overrides,
  };
}

export function criarMockImagemGateway(overrides: Partial<ImagemGateway> = {}): ImagemGateway {
  return {
    gerarUrlUpload: jest.fn().mockResolvedValue({ uploadUrl: "https://upload", urlPublica: "https://cdn/img" }),
    excluirPorUrl: jest.fn(),
    ...overrides,
  };
}

export function criarMockStripeGateway(overrides: Partial<StripeGateway> = {}): StripeGateway {
  return {
    criarSessaoCheckout: jest.fn().mockResolvedValue({ url: "https://stripe.test/checkout", customerId: "cus_1" }),
    criarSessaoPortal: jest.fn().mockResolvedValue({ url: "https://stripe.test/portal" }),
    construirEvento: jest.fn().mockReturnValue(null),
    ...overrides,
  };
}
