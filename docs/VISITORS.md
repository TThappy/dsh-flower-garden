# 访客图鉴的资料与物种范围

本轮只提供资料片段，不修改游戏运行代码。图鉴数据位于根目录 `visitor-info.fragment.js`。`role` 是游戏分类：`pollinator` 只用于蜜蜂、菜粉蝶、夜行型天蛾和 ʻIʻiwi；`guardian` 表示食物网或栖地观察角色，不能理解为保证除虫；`waterside` 表示水岸生态观察者。

## 命名与图形范围

| ID | 推荐中文 / English | 分类范围与注意事项 |
| --- | --- | --- |
| bee | 蜜蜂 / Honey bee | `Apis spp.`，蜜蜂属概括形象；当前黄黑插画不足以指定西方蜜蜂或中华蜜蜂。 |
| butterfly | 菜粉蝶 / Small White | `Pieris rapae`；白翅黑尖和斑点与当前插画相容。不是大菜粉蝶 `P. brassicae`。 |
| ladybug | 七星瓢虫 / Seven-spot ladybird | `Coccinella septempunctata`；现有图明确画七斑，名称合适。主要角色为捕食者，不能把所有瓢虫说成同样食性。 |
| dragonfly | 蜻蜓 / Dragonfly | `Anisoptera`，类群级概括形象，不指定具体种；蜻蜓目 Odonata 还包含豆娘。 |
| firefly | 萤火虫 / Firefly | `Lampyridae`，萤科概括形象，游戏采用夜间闪光型；不代表所有成虫发光、夜行或具有统一食性。 |
| moth | 天蛾（夜行型） / Nocturnal hawk-moth | `Sphingidae`，天蛾科概括形象。按主线设计保留夜间出没，必须替换原名“蜂鸟鹰蛾”。实际 `Macroglossum stellatarum` 为白天访花的蜂鸟鹰蛾，不能把它写成夜行专属。当前图的灰褐前翅、橙褐后翅和长喙仅作概括插画，不作为种级鉴定。 |
| robin | 欧亚鸲（知更鸟） / European robin | `Erithacus rubecula`；当前橙红胸前的画法相容。不能与 American robin 美洲旅鸫混淆；雪原为游戏场景，不意味着专栖高山雪地。 |
| honeycreeper | 镰嘴管舌雀（ʻIʻiwi） / ʻIʻiwi | `Drepanis coccinea`；DLNR 已实读核实，亦列旧名 `Vestiaria coccinea`。红体、黑翼尾、粉红弯喙与当前图一致；确为 ʻōhiʻa 的重要传粉鸟，主要食花蜜并兼食小节肢动物。 |
| kingfisher | 普通翠鸟 / Common kingfisher | `Alcedo atthis`；蓝绿背、橙腹与当前图相容。“翠鸟”可保留简称，但不要把特定种习性推广到全科。 |

## 事实与游戏效果边界

- 蜻蜓、欧亚鸲、普通翠鸟不作为花卉传粉者。萤火虫与七星瓢虫在本游戏采用捕食/栖地角色，不作专职传粉者。
- 可以通过观察记录、栖地目标、幼虫寄主与成年蜜源组合、羽化记录体现价值，不必所有访客都发金币或增加花朵产量。
- 蜻蜓幼虫羽化需要支撑，水边植物有意义；单次蜻蜓或翠鸟出现不能作为水质检测结论。
- ʻIʻiwi 生活在夏威夷中湿、湿润森林。火山场景应理解为火山岛的森林花园，不是裸露熔岩或硫雾中的鸟。
- 现实传粉是花粉转移，可促进种子、果实形成，不会凭空多长出一朵花。“额外收获”若保留应标为游戏奖励。
- 在萤火虫玩法中，夜灯越多并不意味着越适宜；暗夜与湿润微生境更有依据。
- 科级和属级形象的学名字段是分类范围，不是一个具体物种名。游戏出现时间与场景若经过简化，应与现实习性字段分开。

## 实际读取的来源

1. [Xerces — Who Are the Pollinators?](https://www.xerces.org/pollinator-conservation/about-pollinators)：蜂类的毛与携粉、蝶蛾参与传粉、熊蜂低温弱光与振动授粉；亦可作夜行型天蛾图鉴的传粉概览来源。
2. [Butterfly Conservation — Small White](https://butterfly-conservation.org/butterflies/small-white)：`Pieris rapae` 名称、翅斑、十字花科和旱金莲等幼虫寄主。
3. [RHS — Butterflies in your garden](https://www.rhs.org.uk/wildlife/butterflies-in-your-garden)：蝴蝶成虫花蜜与幼虫寄主是不同需求。
4. [RHS — Ladybirds](https://www.rhs.org.uk/biodiversity/ladybirds)：七星瓢虫种名、5–8 mm、红鞘七黑斑、捕食蚜虫及瓢虫食性多样性。
5. [British Dragonfly Society — Life Cycle and Biology](https://british-dragonflies.org.uk/odonata/life-cycle-and-biology/)：水生幼虫、捕食食性、不完全变态与攀爬植物羽化。
6. [Xerces — About Fireflies](https://www.xerces.org/endangered-species/fireflies/about)：萤火虫属于甲虫、幼虫捕食、成虫发光与活动差异，以及光污染等威胁。
7. [UKMoths — Macroglossum stellatarum](https://www.ukmoths.org.uk/species/macroglossum-stellatarum/)：明确记载蜂鸟鹰蛾在阳光下飞行、悬停长喙吸蜜、幼虫取食拉拉藤。用于纠正原夜行物种命名，不作为夜行型的物种资料。
8. [Butterfly Conservation — Humming-bird Hawk-moth](https://butterfly-conservation.org/moths/humming-bird-hawk-moth)：具体种名、灰褐前翅橙褐后翅、寄主与生境。
9. [BTO — Robin](https://www.bto.org/learn/about-birds/birdfacts/robin)：欧亚鸲身份、红胸、林地灌丛与人类居住区生境、非高山特化；本次返回正文未完整覆盖食谱。片段食性仅采用保守概述，不增加具体猎物比例、季节数值或保证除虫效果。
10. [BTO — Kingfisher](https://www.bto.org/learn/about-birds/birdfacts/kingfisher)：普通翠鸟身份、低地河流和静水、捕鱼机会、尖细叫声与水边栖枝观察。
11. [Hawaiʻi DLNR — ʻIʻiwi](https://dlnr.hawaii.gov/wildlife/birds/iiwi/)：已核实 `Drepanis coccinea`、花蜜与小节肢动物食性、ʻōhiʻa 传粉、夏威夷湿润/中湿森林及标志性外形。该页声明用于公众科普而非原创研究数据；勿据旧种群文字声称当前精确保护状态。

搜索工具本轮返回配置端点 HTTP 404，未更改服务配置。上述依据来自成功直接读取的网页。RSPB 和 Woodland Trust 返回内容截断，未把其未显示的正文当作已核证据。

## 可选新增角色（本轮不实现）

- 食蚜蝇 / Hoverfly（Syrphidae）：成虫传粉，许多幼虫捕蚜，但另有腐食和植食种；能连接花源与幼虫栖地。来源：[RHS](https://www.rhs.org.uk/biodiversity/hoverflies)。
- 蚯蚓 / Earthworm：碎屑食与土壤结构、养分循环，适合落叶与堆肥观察。采用本地自然出现，不鼓励现实跨地区释放。来源：[RHS](https://www.rhs.org.uk/biodiversity/earthworms)。
- 熊蜂 / Bumble bee（Bombus spp.）：较冷弱光环境中的传粉及振动授粉，适合特定花形的观察任务。来源：[Xerces](https://www.xerces.org/pollinator-conservation/about-pollinators)。
