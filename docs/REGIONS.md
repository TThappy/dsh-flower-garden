# Woodland and desert regions / 林地与荒漠地区资料

本轮新增两个游戏地区：Woodland 林地与 Desert 荒漠。它们是游戏里的生态主题与解锁区域，不表示这八种植物在同一现实地点原生共域。物种描述只保留 Wikipedia 页面中可核对的形态、生境或花期信息；游戏内的生长秒数、价格和场景倍率是玩法设定。

## Woodland / 林地

- **毛地黄 / Foxglove — *Digitalis purpurea***：Wikipedia 描述其第一年形成有毛的叶莲座，第二年抽出高花葶，悬挂紫色、带斑点的管状花；欧洲温带原生，可在其他地区归化。植株有毒，游戏只作图鉴提示，不作食用或医疗用途。来源：[Wikipedia](https://en.wikipedia.org/wiki/Digitalis_purpurea)
- **蓝铃花 / Common bluebell — *Hyacinthoides non-scripta***：鳞茎多年生，基生线形叶，花葶顶端形成一侧下垂的蓝紫色花序，花被片强烈反卷；常与大西洋地区古老林地林下花毯相关。来源：[Wikipedia](https://en.wikipedia.org/wiki/Hyacinthoides_non-scripta)
- **常春叶仙客来 / Ivy-leaved cyclamen — *Cyclamen hederifolium***：扁圆块茎多年生，叶片常有银灰绿常春藤样斑纹；晚夏至秋季先花后叶，反卷花瓣带 V 形喉部斑纹，花梗结果后会盘旋。来源：[Wikipedia](https://en.wikipedia.org/wiki/Cyclamen_hederifolium)
- **林银莲花 / Wood anemone — *Anemone nemorosa*（页面现行组合名 *Anemonoides nemorosa*）**：欧洲林下的低矮根茎多年生，春季开单朵白色或淡色花，基生叶掌状分裂；花后夏季休眠。页面也记录其常与食蚜蝇等昆虫传粉相关。来源：[Wikipedia](https://en.wikipedia.org/wiki/Anemone_nemorosa)

## Desert / 荒漠

- **花菱草 / California poppy — *Eschscholzia californica***：灰绿色分裂叶，长花梗顶端单生四瓣丝绸状花，花色可黄、橙或红；夜间、寒冷或风天花瓣会闭合，原生于美国西部和墨西哥部分地区。来源：[Wikipedia](https://en.wikipedia.org/wiki/Eschscholzia_californica)
- **沙漠金盏菊 / Desert marigold — *Baileya multiradiata***：北美西南与墨西哥荒漠的短命多年生或一年生，银绿色丛生叶片上抽出多条裸花葶，每条顶端为黄色菊状花头，花期可跨春至秋。来源：[Wikipedia](https://en.wikipedia.org/wiki/Baileya_multiradiata)
- **钓钟柳 / Beardlip penstemon — *Penstemon barbatus***：美国西部原生，直立花茎可成串着生猩红色狭长管花，花管下唇内有黄色绒毛；页面记载其花吸引蜂鸟，并与高地林地、山地草甸等生境相关。来源：[Wikipedia](https://en.wikipedia.org/wiki/Penstemon_barbatus)
- **月见草 / Common evening-primrose — *Oenothera biennis***：通常二年生，第一年为基生莲座，第二年抽出高茎；四瓣黄色花在傍晚快速开放，花朵通常持续到翌日中午，夜间访花者可观察到明显开花节律。来源：[Wikipedia](https://en.wikipedia.org/wiki/Oenothera_biennis)

## Game integration boundary / 游戏接入边界

`regions.fragment.js` 只提供待插入的 `REGION_SPECIES`、中英文词条和 `REGION_PLANTS`。主线负责把 `woodland`、`desert` 加入 `SCENES`，设置解锁价格、生态角色、访客偏好、全景背景与图鉴排序。八个绘制函数各自表现不同结构：高穗管花、单侧下垂花序、块茎与卷曲花梗、低矮春花、四瓣闭合花、裸葶菊花头、红色管花穗、夜间开放花穗；它们不是已有花型的单纯换色。

Wikipedia 图片未复制到项目；片段中的图形均为自行绘制的简化 SVG。毒性、归化与现实生境只在资料层说明，不转成现实健康建议。
