# evergreenbloom-demo

松櫻祭視覺風格確認用的純前端 demo（無建置、無依賴）。線上版：https://fearnot221.github.io/evergreenbloom-demo/

本機預覽：

```bash
python3 -m http.server 8000
```

- 四頁：主視覺 / 宣言 / 松 / 櫻
- 色票：`#DCB5FF` `#97CBFF` `#BBFFBB` `#FFFFB9` `#FFC1E0`（草地斜面 `#AEFFDC`、樹幹取自版面圖）
- 字體：目標為可畫「輕中宋」，demo 暫以 Google Fonts 的 Noto Serif TC 代替
- 質感：固定在後方緩慢漂移的噴漆色霧；逐像素磨砂雜訊（overlay）＋大塊噴漆不均＋白色粉點
- 動態（`main.js` + `style.css`）：拱窗由中心向外展開、外框描線、樹幹生長、雲與花球綻放、大字由模糊浮現；捲動視差、主視覺滑鼠景深、斜向落花、雲輕浮與花球呼吸；章節切換時天空換主色
- 捲動：不吸附章節；只在電腦（滑鼠／觸控板）上以 Lenis 1.3.26（jsDelivr CDN，預設參數，與 sitcon.org/2026 相同）做阻尼緩停；CDN 失敗時退回原生捲動
- 03→04：一條跨兩頁的草地流帶，黃邊隨捲動描出，松的樹根種在流帶裡
- `prefers-reduced-motion`：直接顯示完成狀態，關閉漂移、視差、落花與阻尼捲動
