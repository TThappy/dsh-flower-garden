# 花园 / Flower garden

A DSH session view where you grow twenty-five real flowers across four grounds.

会话视图里的养花游戏：草原、雪原、火山口、湖畔四块地，二十五种真实花卉，按真实形态绘制、按真实时间生长。

## Where it appears / 出现位置

A **Garden (花园)** tab joins the session view tab row next to Chat and
Trajectory once a session has started. Blank sessions show no tabs, so send a
first message (or pick a workspace) to see it.

会话开始后，视图标签栏（Chat、Trajectory 旁边）多出 **花园** 标签。空白会话不显示
标签栏，发一条消息或选好工作目录后即可看到。

## The loop / 玩法循环

1. **播种** — 在花地上选种子，扣金币，土壤浇水满。
2. **浇水** — 免费补满湿度；一次浇透大约能长到七成半，之后干了生长暂停。
3. **收获** — 开花后收进**花篮**（12 格），收获给经验。
4. **查看 / 卖出** — 点花篮里的花会展开这朵花的详情（大图、学名、花语、单价与合计），在详情里卖出（点两次确认）；或凑成**花束委托**交付，拿更多金币。
5. **道具** — 金币买肥料、洒水器、幸运符，以及花篮扩容。
6. **开地** — 金币解锁新花地和新花圃。
7. **图鉴** — 每款花第一次收获后解锁花语与学名；点卡片上的花或款式标签，可以放大看这一款的样子（含学名、花语、收获次数）。

## Four grounds / 四块花地

| 花地 | 解锁 | 对天气的反应 |
| --- | --- | --- |
| 草原 Meadow | 初始 | 晴 +15%、阴 如常、雨 土壤自动湿润 |
| 雪原 Snowfield | 150 金币 | 晴雪 +5%、阴雪 −5%、降雪 湿润但 −10% |
| 火山口 Crater | 450 金币 | 热浪 +25%、硫雾 −10%、落灰 −15% 且**不**湿润 |
| 湖畔 Lakeside | 1200 金币 | 晴 +10%、薄云 +5%、细雨 +20% 并湿润 |

每块地 6 个花圃，初始开 3 个，另外 3 个按 40 / 90 / 160 金币依次解锁。天气每 5 分钟
换一次，按时间种子确定，所以同一时刻永远是同一种天气；离线补算也按天气分段精确积分。

## Twenty-five species / 二十五种花

| 花地 | 花（学名） | 种子 | 生长 | 卖价 | 经验 |
| --- | --- | --- | --- | --- | --- |
| 草原 | 蒲公英 *Taraxacum officinale* | 3 | 45 秒 | 6 | 1 |
| 草原 | 雏菊 *Bellis perennis* | 5 | 60 秒 | 10 | 2 |
| 草原 | 樱花 *Prunus serrulata* | 10 | 120 秒 | 21 | 4 |
| 草原 | 郁金香 *Tulipa gesneriana* | 14 | 150 秒 | 29 | 5 |
| 草原 | 薰衣草 *Lavandula angustifolia* | 18 | 180 秒 | 38 | 7 |
| 草原 | 虞美人 *Papaver rhoeas* | 22 | 210 秒 | 47 | 9 |
| 草原 | 向日葵 *Helianthus annuus* | 26 | 240 秒 | 56 | 11 |
| 草原 | 百合 *Lilium candidum* | 32 | 290 秒 | 70 | 13 |
| 草原 | 玫瑰 *Rosa rugosa* | 40 | 340 秒 | 88 | 17 |
| 草原 | 绣球 *Hydrangea macrophylla* | 50 | 400 秒 | 112 | 22 |
| 雪原 | 雪滴花 *Galanthus nivalis* | 8 | 90 秒 | 17 | 3 |
| 雪原 | 铁筷子 *Helleborus niger* | 16 | 170 秒 | 35 | 6 |
| 雪原 | 梅花 *Prunus mume* | 24 | 230 秒 | 52 | 10 |
| 雪原 | 雪绒花 *Leontopodium nivale* | 34 | 300 秒 | 75 | 14 |
| 雪原 | 山茶 *Camellia japonica* | 46 | 370 秒 | 104 | 20 |
| 火山口 | 仙人掌花 *Opuntia ficus-indica* | 12 | 130 秒 | 26 | 4 |
| 火山口 | 红火山花 *Metrosideros polymorpha* | 22 | 200 秒 | 46 | 8 |
| 火山口 | 龙舌兰 *Agave americana* | 36 | 310 秒 | 80 | 15 |
| 火山口 | 银剑草 *Argyroxiphium sandwicense* | 52 | 420 秒 | 120 | 23 |
| 火山口 | 鸡蛋花 *Plumeria rubra* | 64 | 500 秒 | 152 | 29 |
| 湖畔 | 梭鱼草 *Pontederia cordata* | 14 | 140 秒 | 30 | 4 |
| 湖畔 | 千屈菜 *Lythrum salicaria* | 26 | 220 秒 | 55 | 10 |
| 湖畔 | 黄菖蒲 *Iris pseudacorus* | 38 | 300 秒 | 82 | 15 |
| 湖畔 | 睡莲 *Nymphaea alba* | 54 | 400 秒 | 120 | 22 |
| 湖畔 | 荷花 *Nelumbo nucifera* | 70 | 520 秒 | 165 | 30 |

每种花按植物学形态单独绘制：雏菊/向日葵是舌状花瓣围花盘，蒲公英是密实黄色头状花序，
樱花是五枚带缺刻的花瓣，郁金香是杯状花冠，薰衣草/千屈菜/梭鱼草是穗状花序，虞美人四枚
薄花瓣，百合六枚尖瓣，玫瑰层叠螺旋，绣球是四萼片小花组成的球，雪滴花是三枚下垂花瓣，
雪绒花是毡毛星状苞片，梅花/铁筷子五枚圆瓣，红火山花是细长雄蕊组成的绒球，龙舌兰/银剑
草是花葶上的密集小花，鸡蛋花是五瓣风车，鸢尾是三枚直立瓣加三枚下垂瓣，睡莲是平铺的
星形，荷花是多层尖瓣。

## Items / 道具

| 道具 | 价格 | 作用 |
| --- | --- | --- |
| 肥料 Fertiliser | 35 | 对一株花使用：瞬间推进 **25%** 生长（不会越过开花） |
| 洒水器 Sprinkler | 90 | 对**当前花地**使用：30 分钟内整块地自动保湿，土壤不再变干 |
| 幸运符 Lucky charm | 120 | 启用后**下一次收获**仙品概率 +25%（与其它加成叠加，上限 55%），无论是否出仙品都会消耗 |
| 花篮扩容 Basket upgrade | 150 | 花篮 12 → **18** → **24** 格，最多 2 次 |

花篮里的每一款花都可以点开看：详情面板里是这朵花的完整插画（仙品带光晕和星芒）、学名、花语、
单价与合计，卖出按钮就在面板里，避免误点。图鉴里**收获过的**花也一样——点卡片上的花或「原色／别色／仙品」
标签，就会展开同一张详情卡（这朵花的插画、学名、花语和收获次数），没收到过的仍是剪影。

用法：肥料会在有花的花圃上多出一个「施肥」按钮；洒水器/幸运符在「道具」面板里点「对本地使用」／「启用」；
花篮扩容购买后立即生效。洒水器运行时，花地标题旁会显示剩余时间，花圃状态改为「湿 100%」且不再提示干透。

## Variants and the hidden bloom / 花色与隐藏款

每种花在图鉴里有 2~3 条款目：

| 款 | 怎么来 | 卖价 |
| --- | --- | --- |
| 原色 | 双数花圃开花 | ×1 |
| 别色 | 只在 **#1 / #3 / #5** 号花圃开花（15 种花有自然别色） | ×1.3 |
| 仙品（隐藏款） | 收获时随机触发 | ×3 |

仙品外形是**通体发光**的：珍珠白到淡紫的渐变花瓣、身后的柔光晕、缓慢自转的虚线圈、
四角星芒和上浮的光点（`prefers-reduced-motion` 下静止）。概率 = 基础 **3%**，再叠加：整株**从未缺水** +7%、在**本地偏爱的天气**里收获 +5%、
**刚浇过水**（湿度 ≥80%）+8%、**夜里**（22:00–05:00）收获 +7%，上限 **30%**。图鉴里会
写明这条线索。仙品不参与花束交付，只用来卖出（3 倍价）。

## Limits / 说明

- The garden is stored in this browser's `localStorage` for the running profile
  (`dsh.flower-garden.v3`) and is shared by every session. It is not part of the
  session log, so it does not travel with a session export or a fork. A v1 or v2
  garden is migrated on first load (coins, experience, plots, and every flower already recorded).
- Nothing is sent anywhere: no model request, no tool call, no network access.
- Turning the plugin off removes the tab and keeps the saved garden.
- Progress is per browser: two windows that both show the garden overwrite each
  other's save in last-write-wins order.

花园进度保存在当前运行环境的浏览器 `localStorage`（`dsh.flower-garden.v3`），所有
会话共用，不写入会话日志，因此不会随会话导出或 fork 一起迁移。旧版存档
（v1/v2）首次加载时迁移：金币、经验、花圃和已收集的花都会保留，旧记录记为「原色」。
插件不发任何模型请求、工具调用或网络请求；关闭插件只会隐藏标签，花园数据仍然保留。

## Development / 本地开发

```bash
npm install          # 只为跑测试和生成预览图（react / react-dom 是 devDependencies）
npm test             # 数值断言 + 静态渲染断言
npm run preview      # 用游戏同一套绘制代码重新生成 docs/preview.svg
```

项目结构：

```
package.json        bundle 清单（dsh.bundle + dsh.client）+ 测试脚本
cordis.patch.yml    插入 flower-garden 插件行
index.js            Host 半边：无行为，只负责让插件行可解析
client.js           浏览器半边：花园视图、场景、规则、绘制、样式
locale/*.json       插件管理页的标题 / 描述 / 详情文档
docs/               一张预览图（由同一套绘制代码生成）
test/               数值检查 + 渲染检查
tools/preview.cjs   预览图生成器
```

安装到 DSH：在 DSH 的 **设置 → 插件 → 添加插件** 里选择本目录（本地目录安装是
link，改动本目录后刷新页面即可生效）。

The preview image in `docs/preview.svg` was generated from the same `FlowerArt`
code the view renders — one flower from each ground.
