# Magic Slug

Jogo de ação em pixel art no estilo Metal Slug, só que com **magia no lugar de armas**. Um mago e um arqueiro
atravessam masmorras e templos cheios de zumbis. Feito na **Godot 4**, roda nativo no Mac (Apple Silicon M1 ou mais novo).

Os efeitos (bola de fogo, flechas, explosões, tochas, morcegos) vêm do [pixelfx](https://github.com/patch-gg/pixelfx)
(incluído em `tools/pixelfx`). Os personagens são desenhados em código, em estilo caricato de cabeça grande
(`tools/art/characters.mjs`).

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

- **Zacarias, o Mago**: nariz vermelho, sobrancelhas de vassoura e um chapéu maior que ele. Ataque básico: **bola de fogo**. Especial: **Meteoro** (lançado em arco, explode em área).
- **Tico, o Arqueiro**: ruivo, queixudo e dentuço. Ataque básico: **uma flecha** rápida. Especial: **Chuva de flechas** na área à frente.

As magias especiais são limitadas (como as granadas do Metal Slug). Cristais azuis dão +3.

### Poderes

Como as armas do Metal Slug: inimigos derrotados às vezes deixam cair uma pedra com uma letra. Pegue para trocar o
ataque básico por um tempo (até acabar a carga ou você morrer). Nenhum é mais forte que o normal, só muda o jeito de jogar.

| Pedra | Poder | Como funciona |
|---|---|---|
| T | Tiro Triplo | 3 tiros em leque, mais fracos |
| R | Ricochete | Orbe que quica no chão |
| G | Lança de Gelo | Atravessa os inimigos, dispara devagar |
| B | Bumerangue | Disco que vai e volta |
| H | Rajada | Tiros fracos e muito rápidos (segure o botão) |

### Novidades da 0.3

- **Armas que mudam**: cada poder troca o cajado do Zacarias (tridente, orbe, cristal, lua, raio) e o arco do Tico
  (arco triplo, arco de orbe, arco de gelo, arco curvo, besta com tambor).
- **Animações de impacto**: o jogo congela uma fração de segundo nos golpes, inimigos piscam, tremem, espirram gosma e
  voam para trás ao morrer; levar dano deixa a tela vermelha; morrer dá um clarão; pegar poder solta anéis da cor do poder.
- **Fosso com água** que reflete o cenário e quem passa por cima. Cair nele = splash e perde uma vida.
- **Som**: efeitos e músicas feitos em código, em estilo Mega Drive (FM) com pegada synthwave. Melodias originais.

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
tools/art/               scripts que geram a arte: characters.mjs (personagens), environment.mjs (cenário e ícones), export_fx.mjs
tools/audio/             scripts que geram o som: make_sfx.mjs (efeitos), make_music.mjs (músicas)
NOTES.md                 mapa curto do projeto para as próximas atualizações
CHANGELOG.md             o que mudou em cada versão
```

## Regenerar a arte (opcional)

Precisa do Node 18+. `node tools/art/characters.mjs` (personagens), `node tools/art/environment.mjs` (cenário),
`node tools/art/export_fx.mjs` (efeitos do pixelfx listados em `game/data/fx.json`).
Som: `node tools/audio/make_sfx.mjs` e `node tools/audio/make_music.mjs`. Volumes em `game/data/audio.json`.

## Licenças

Código e arte deste projeto: do autor. pixelfx: MIT (veja `tools/pixelfx/LICENSE`).
