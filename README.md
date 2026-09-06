# GR00T N1.7 Action Flow Learning Site

NVIDIA Isaac GR00T N1.7 が、画像・言語・Robot State を条件として Gaussian Noise から Action Chunk を生成する処理を、現行ソースコードに沿って学ぶ GitHub Pages 教材。

## Source of Truth

調査日: 2026-09-06

基準にした NVIDIA/Isaac-GR00T `main` commit:

- `51d4c89f72fda44cbf77285c6a8114b52676b8a1`
- https://github.com/NVIDIA/Isaac-GR00T/tree/51d4c89f72fda44cbf77285c6a8114b52676b8a1

特に参照した実装:

- `gr00t/configs/model/gr00t_n1d7.py`
- `gr00t/model/gr00t_n1d7/gr00t_n1d7.py`
- `gr00t/model/gr00t_n1d7/processing_gr00t_n1d7.py`
- `gr00t/model/modules/embodiment_conditioned_mlp.py`
- `gr00t/model/modules/qwen3_backbone.py`
- `gr00t/data/state_action/action_chunking.py`
- `scripts/deployment/standalone_inference_script.py`
- `getting_started/real_world_deployment.md`

## Structure

- `index.html` — 学習コンテンツ本体
- `assets/styles.css` — レスポンシブUI
- `assets/app.js` — Flow Matching / Execution Horizon のインタラクティブ教材
- `.github/workflows/pages.yml` — GitHub Pages deployment

## Important distinction

N1.7 model config の `action_horizon=40` は Action Head が扱う最大テンソルhorizon。個別 Embodiment の有効horizonは `ModalityConfig.action.delta_indices` で 40 未満にもなり、processor が horizon/dimension をpaddingし `action_mask` で有効領域を示す。

`Execution Horizon` はモデル固定値ではなく、デプロイ側で「予測chunkの何stepを次の推論まで実行するか」を決める値。公式 standalone inference script には `--execution-horizon 8` の例がある。
