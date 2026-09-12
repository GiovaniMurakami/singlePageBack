import { GerarUrlUploadImagem } from "../../../src/casosDeUso/imagem/gerarUrlUploadImagem";
import { criarMockImagemGateway } from "../../mocks/gateways";

describe("gerarUrlUploadImagem", () => {
  it("gera url para jpeg valido", async () => {
    const imagem = criarMockImagemGateway();
    const resultado = await GerarUrlUploadImagem.criar(imagem).executar({
      contentType: "image/jpeg",
      tamanhoBytes: 1024,
      usuarioId: "u1",
    });
    expect(resultado.uploadUrl).toBeTruthy();
    expect(imagem.gerarUrlUpload).toHaveBeenCalled();
  });

  it("rejeita tipo e tamanho invalidos", async () => {
    const caso = GerarUrlUploadImagem.criar(criarMockImagemGateway());
    await expect(caso.executar({ contentType: "application/pdf", tamanhoBytes: 10, usuarioId: "u1" }))
      .rejects.toMatchObject({ status: 400 });
    await expect(caso.executar({ contentType: "image/png", tamanhoBytes: 9 * 1024 * 1024, usuarioId: "u1" }))
      .rejects.toMatchObject({ status: 400 });
    await expect(caso.executar({ contentType: "image/png", tamanhoBytes: 0, usuarioId: "u1" }))
      .rejects.toMatchObject({ status: 400 });
  });
});
