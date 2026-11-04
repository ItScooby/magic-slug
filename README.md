# Magic Slug

Jogo de ação em pixel art no estilo Metal Slug, só que com **magia no lugar de armas**. Um mago e um arqueiro
atravessam masmorras e templos cheios de zumbis. Feito na **Godot 4**, roda nativo no Mac (Apple Silicon M1 ou mais novo).

Toda a arte vem do [pixelfx](https://github.com/patch-gg/pixelfx) (incluído em `tools/pixelfx`): os efeitos (bola de fogo,
flechas, explosões, tochas, morcegos) e o esqueleto animado que veste o mago, o arqueiro e os zumbis.

## Como jogar no Mac

1. Baixe a **Godot 4.3 ou mais nova** (versão padrão, não a .NET) em <https://godotengine.org/download/macos/> e
   arraste para Aplicativos.
2. Baixe este repositório: botão verde **Code > Download ZIP** no GitHub (ou `git clone --recursive`). O ZIP vem sem a pasta `tools/pixelfx`, mas o jogo não precisa dela para rodar (só para gerar arte nova).
3. Abra a Godot, clique em **Import**, escolha o arquivo `game/project.godot` e depois **Import & Edit**.
4. Aperte **F5** (ou o botão ▶ no canto superior direito). O jogo abre numa janela.

Na primeira vez a Godot leva alguns segundos importando as imagens.

### Controle de PS5

Conecte o DualSense por cabo USB-C, ou por Bluetooth (segure **PS + Create** até a luz piscar e pareie em
Ajustes do Sistema > Bluetooth). Ligue o controle antes de abrir o jogo.

| Ação | DualSense | Teclado |
|---|---|---|
| Andar / mirar para cima / agachar | Analógico esquerdo ou direcional | Setas ou WASD |
| Pular | X (Cross) | Espaço ou K |
| Ataque básico | Quadrado | J ou Z |
| Magia especial | Bola (Circle) | L ou X |
| Trocar de herói (só na demo) | Triângulo | Tab ou C |
| Pausa | Options | Esc, P ou Enter |

Segure Cima para atacar para cima. No ar, segure Baixo para atacar para baixo. Baixo + Pular desce de uma plataforma.

### Heróis

- **Mago**: ataque básico é uma **bola de fogo** forte. Especial: **Meteoro** (lançado em arco, explode em área).
- **Arqueiro**: ataque básico é uma **salva de 3 flechas**. Especial: **Chuva de flechas** na área à frente.

As magias especiais são limitadas (como as granadas do Metal Slug). Cristais azuis dão +3.

### Gerar um app (.app) para abrir sem a Godot

Na Godot: **Project > Export**, escolha o preset **macOS** (já vem configurado), clique em **Manage Export Templates**
e baixe os templates na primeira vez, depois **Export Project**. O app sai em `build/`. Como não é assinado pela Apple,
na primeira vez abra com clique direito > **Abrir**.

## Estrutura

```
game/                    projeto Godot (abra game/project.godot)
  data/*.json            heróis, magias, inimigos, efeitos e fases: balanceamento sem mexer em código
  scripts/               código (veja NOTES.md)
  assets/                sprites gerados (não edite à mão: rode os scripts de tools/art)
tools/pixelfx/           biblioteca de pixel art (submódulo git)
tools/art/               scripts que geram a arte: characters.mjs, environment.mjs, export_fx.mjs
NOTES.md                 mapa curto do projeto para as próximas atualizações
CHANGELOG.md             o que mudou em cada versão
```

## Regenerar a arte (opcional)

Precisa do Node 18+. `node tools/art/characters.mjs` (personagens), `node tools/art/environment.mjs` (cenário),
`node tools/art/export_fx.mjs` (efeitos do pixelfx listados em `game/data/fx.json`).

## Licenças

Código e arte deste projeto: do autor. pixelfx: MIT (veja `tools/pixelfx/LICENSE`).
