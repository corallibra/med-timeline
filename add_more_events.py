#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Append additional researched events to timeline.json."""
import json
from pathlib import Path
from copy import deepcopy

path = Path(__file__).resolve().parent / "data" / "timeline.json"
data = json.loads(path.read_text(encoding="utf-8"))
existing = {e["id"] for e in data["events"]}

def e(id, side, year, title, summary, people=None, works=None, archaeology=False,
      tags=None, confidence="high", sources=None, year_end=None, year_label=None):
    if year_label is None:
        if year < 0:
            year_label = f"约前{abs(year)}" if year_end is None else (
                f"约前{abs(year)}–前{abs(year_end)}" if year_end < 0 else f"约前{abs(year)}–{year_end}"
            )
        else:
            year_label = str(year) if year_end is None else f"{year}–{year_end}"
    return {
        "id": id, "side": side, "year": year, "yearEnd": year_end, "yearLabel": year_label,
        "title": title, "summary": summary, "people": people or [], "works": works or [],
        "archaeology": archaeology, "tags": tags or [], "confidence": confidence,
        "sources": sources or [],
    }

extra = [
# ---- more WEST ----
e("west-asklepieion-cult", "west", -500,
  "阿斯克勒庇俄斯神庙医疗",
  "约公元前5世纪起，希腊各地阿斯克勒庇俄斯神庙（Asklepieion）以孵梦疗法、仪式与经验护理并行，是宗教—医疗复合机构的代表。",
  tags=["希腊","神庙","宗教医疗"], confidence="medium",
  sources=["wikipedia:Timeline_of_medicine"],
  year_label="约前500"),

e("west-diocles-carystus", "west", -350,
  "卡里斯托斯的狄奥克勒斯",
  "狄奥克勒斯（约前375–前295）著生理学与饮食著作，被誉为“第二希波克拉底”，代表希波克拉底后雅典医学。",
  people=["Diocles of Carystus"], tags=["希腊","饮食","生理"], confidence="medium",
  sources=["wikipedia:Timeline_of_medicine", "Nutton"],
  year_end=-295, year_label="约前375–前295"),

e("west-aretaeus-cappadocia", "west", 150,
  "卡帕多西亚的阿雷泰乌斯",
  "阿雷泰乌斯约2世纪以精确临床描述著称，对糖尿病、神经系统疾病等有经典记述。",
  people=["Aretaeus of Cappadocia"], tags=["罗马","临床","糖尿病"], confidence="high",
  sources=["wikipedia:Timeline_of_medicine"],
  year_label="约150"),

e("west-rufus-ephesus", "west", 100,
  "以弗所的鲁弗斯",
  "鲁弗斯约1–2世纪写作解剖与病名学著作，强调解剖对临床的重要性。",
  people=["Rufus of Ephesus"], tags=["罗马","解剖","名词"], confidence="high",
  sources=["wikipedia:Timeline_of_medicine"],
  year_label="约100"),

e("west-haly-abbas-maliki", "west", 980,
  "马朱西《王书》",
  "阿里·伊本·阿巴斯·马朱西（Haly Abbas）著《医学全书》（Liber Regius），结构清晰，经拉丁译本影响萨勒诺与欧洲课程。",
  people=["Ali ibn al-Abbas al-Majusi"], works=["Kamil al-Sina'a al-Tibbiyya"],
  tags=["伊斯兰","百科","教材"], confidence="high",
  sources=["wikipedia:Timeline_of_medicine"],
  year_label="约980"),

e("west-avenzoar-surgery", "west", 1140,
  "伊本·祖赫尔（阿文佐亚）",
  "伊本·祖赫尔（Avenzoar，约1090–1162）强调实验观察与外科，是阿维罗伊之师，代表安达卢斯临床医学高峰。",
  people=["Ibn Zuhr (Avenzoar)"], tags=["伊斯兰","外科","安达卢斯"], confidence="high",
  sources=["wikipedia:Timeline_of_medicine"],
  year_label="约1140"),

e("west-averroes-medicine", "west", 1160,
  "阿维罗伊医学与哲学",
  "伊本·鲁世德（Averroes，1126–1198）注释亚里士多德并撰写医学著作，影响拉丁经院医学哲学讨论。",
  people=["Ibn Rushd (Averroes)"], tags=["伊斯兰","哲学","医学"], confidence="high",
  sources=["wikipedia:Timeline_of_medicine"],
  year_label="约1160"),

e("west-ibn-al-baytar", "west", 1248,
  "伊本·拜塔尔本草",
  "伊本·拜塔尔约1248年完成大型本草与药学著作，广收地中海与东方药物，是中世纪药学集大成者之一。",
  people=["Ibn al-Baytar"], tags=["伊斯兰","本草","药学"], confidence="high",
  sources=["wikipedia:Timeline_of_medicine"],
  year_label="约1248"),

e("west-spectacles-convex", "west", 1286,
  "凸透镜眼镜矫正远视",
  "约13世纪末意大利出现凸透镜眼镜治疗远视，是光学辅助医疗的重要发明。",
  tags=["眼科","光学","中世纪"], confidence="medium",
  sources=["wikipedia:Timeline_of_medicine"],
  year_label="约1286"),

e("west-john-arderne", "west", 1370,
  "约翰·阿德恩肛瘘手术",
  "英格兰外科医生约翰·阿德恩约14世纪以肛瘘手术闻名，留下详细手术记录，代表中世纪外科专业化。",
  people=["John of Arderne"], tags=["中世纪","外科"], confidence="high",
  sources=["wikipedia:Timeline_of_medicine"],
  year_label="约1370"),

e("west-paracelsus-birth", "west", 1493,
  "帕拉塞尔苏斯出生",
  "帕拉塞尔苏斯1493年出生于瑞士，后以医化学挑战古代权威，象征文艺复兴医学的反叛气质。",
  people=["Paracelsus"], tags=["文艺复兴","化学医学"], confidence="high",
  sources=["wikipedia:Timeline_of_medicine"],
  year_label="1493"),

e("west-garcia-de-orta", "west", 1563,
  "奥尔塔《印度药物谈》",
  "加西亚·德·奥尔塔1563年在果阿出版印度药物与热带病论著，开创欧洲热带医学文献传统。",
  people=["Garcia de Orta"], tags=["热带医学","本草","大航海"], confidence="high",
  sources=["wikipedia:Timeline_of_medicine"],
  year_label="1563"),

e("west-malpighi-capillaries", "west", 1661,
  "马尔皮基发现毛细血管",
  "马尔切洛·马尔皮基约1661年用显微镜观察毛细血管，填补哈维循环理论中动脉与静脉的连接环节。",
  people=["Marcello Malpighi"], tags=["显微","循环","生理"], confidence="high",
  sources=["History of medicine surveys"],
  year_label="约1661"),

e("west-leeuwenhoek-microbes", "west", 1676,
  "列文虎克观察微生物",
  "安东尼·范·列文虎克1670年代用自制显微镜观察“微小动物”，为微生物学提供视觉证据。",
  people=["Antonie van Leeuwenhoek"], tags=["显微","微生物学"], confidence="high",
  sources=["History of medicine surveys"],
  year_label="约1676"),

e("west-sydenham-clinical", "west", 1676,
  "西德纳姆临床观察医学",
  "托马斯·西德纳姆强调床边观察与疾病自然史，被誉为“英格兰希波克拉底”，影响经验临床医学。",
  people=["Thomas Sydenham"], works=["Observationes Medicae"],
  tags=["临床","英国"], confidence="high",
  sources=["Porter Greatest Benefit"],
  year_label="约1676"),

e("west-santorio-quantification", "west", 1614,
  "桑托里奥计量生理学",
  "桑托里奥·桑托里奥以秤测“无形出汗”等，开创计量实验生理学先河。",
  people=["Santorio Santorio"], tags=["生理","计量","实验"], confidence="high",
  sources=["History of medicine surveys"],
  year_label="约1614"),

e("west-boerhaave-leiden", "west", 1708,
  "布尔哈弗莱顿临床教学",
  "赫尔曼·布尔哈弗在莱顿将床边教学与化学、解剖结合，培养全欧医师，代表18世纪初临床医学。",
  people=["Herman Boerhaave"], tags=["教育","临床","荷兰"], confidence="high",
  sources=["Porter"],
  year_label="约1708"),

e("west-montagu-variolation-britain", "west", 1721,
  "蒙塔古夫人引入人痘至英国",
  "玛丽·沃特利·蒙塔古夫人基于奥斯曼观察，约1721年推动人痘接种在英国贵族中试验推广。",
  people=["Lady Mary Wortley Montagu"], tags=["疫苗","天花","接种"], confidence="high",
  sources=["wikipedia:Timeline_of_medicine"],
  year_label="1721"),

e("west-aymand-appendectomy", "west", 1736,
  "艾曼首例成功阑尾切除",
  "克劳迪乌斯·艾曼1736年完成文献记载较早的成功阑尾切除术。",
  people=["Claudius Amyand"], tags=["外科","阑尾"], confidence="high",
  sources=["wikipedia:Timeline_of_medicine"],
  year_label="1736"),

e("west-priestley-n2o", "west", 1774,
  "普里斯特利发现氧化亚氮",
  "约瑟夫·普里斯特利1774年发现氧化亚氮等气体；后被戴维注意其麻醉潜能。",
  people=["Joseph Priestley"], tags=["麻醉","化学"], confidence="high",
  sources=["wikipedia:Timeline_of_medicine"],
  year_label="1774"),

e("west-davy-n2o-anesthesia", "west", 1799,
  "戴维指出氧化亚氮麻醉性",
  "汉弗莱·戴维1799–1800年记述氧化亚氮可缓解疼痛，为吸入麻醉史提供早期线索。",
  people=["Humphry Davy"], tags=["麻醉"], confidence="high",
  sources=["wikipedia:Timeline_of_medicine"],
  year_label="1799"),

e("west-larrey-ambulance", "west", 1797,
  "拉雷飞骑救护与战伤外科",
  "拿破仑军医多米尼克·拉雷改进战地救护（飞骑救护车）与截肢时机，推动军事外科学。",
  people=["Dominique Jean Larrey"], tags=["军事医学","外科","急救"], confidence="high",
  sources=["wikipedia:Timeline_of_medicine"],
  year_label="约1797"),

e("west-snow-cholera-map", "west", 1854,
  "斯诺霍乱地图与水泵",
  "约翰·斯诺1854年通过伦敦宽街霍乱地图论证水源传播，成为流行病学经典案例。",
  people=["John Snow"], tags=["流行病学","霍乱","公共卫生"], confidence="high",
  sources=["History of public health"],
  year_label="1854"),

e("west-nightingale-nursing", "west", 1860,
  "南丁格尔护理学校",
  "弗洛伦斯·南丁格尔克里米亚战争后推动医院卫生改革，1860年在圣托马斯医院创办护理学校，奠基现代护理。",
  people=["Florence Nightingale"], tags=["护理","医院","公共卫生"], confidence="high",
  sources=["History of nursing"],
  year_label="1860"),

e("west-bernard-physiology", "west", 1865,
  "贝尔纳实验生理学与内环境",
  "克洛德·贝尔纳提出内环境稳定等概念，确立现代实验生理学方法。",
  people=["Claude Bernard"], works=["Introduction to the Study of Experimental Medicine"],
  tags=["生理","实验"], confidence="high",
  sources=["Porter"],
  year_label="约1865"),

e("west-koch-postulates", "west", 1884,
  "科赫法则系统表述",
  "罗伯特·科赫在研究病原菌过程中形成后称“科赫法则”的验证步骤，成为传染病病因学标准。",
  people=["Robert Koch"], tags=["微生物学","方法"], confidence="high",
  sources=["wikipedia:History_of_medicine"],
  year_label="约1884"),

e("west-pasteur-institute", "west", 1888,
  "巴斯德研究所成立",
  "1888年巴黎巴斯德研究所开幕，成为全球生物医学研究机构的早期典范。",
  people=["Louis Pasteur"], tags=["研究机构","微生物学"], confidence="high",
  sources=["wikipedia:History_of_medicine"],
  year_label="1888"),

e("west-riva-rocci-bp", "west", 1896,
  "里瓦-罗奇血压计",
  "希皮奥内·里瓦-罗奇1896年发明袖带血压计，使无创血压测量进入临床常规。",
  people=["Scipione Riva-Rocci"], tags=["诊断","血压","器械"], confidence="high",
  sources=["Cardiology history"],
  year_label="1896"),

e("west-ehrlich-salvarsan", "west", 1910,
  "洒尔佛散治疗梅毒上市",
  "埃利希与秦佐八郎研制的砷剂洒尔佛散（606）约1910年用于梅毒，标志化疗药物时代。",
  people=["Paul Ehrlich", "Sahachiro Hata"], tags=["化疗","梅毒","药物"], confidence="high",
  sources=["wikipedia:Timeline_of_medicine"],
  year_label="1910"),

e("west-bacteriophage-twort-dherelle", "west", 1917,
  "噬菌体发现",
  "约1915–1917年特沃特与德埃雷尔发现噬菌体，后成为分子遗传与替代抗菌研究的重要对象。",
  people=["Frederick Twort", "Félix d'Hérelle"], tags=["微生物学","噬菌体"], confidence="high",
  sources=["Microbiology history"],
  year_label="约1917"),

e("west-minot-murphy-anemia", "west", 1926,
  "米诺特肝食疗法治疗恶性贫血",
  "乔治·米诺特与威廉·墨菲1926年用肝食疗法治疗恶性贫血，导向维生素B12发现，1923年后获诺贝尔奖。",
  people=["George Minot", "William Murphy"], tags=["血液","营养","维生素"], confidence="high",
  sources=["Nobel archives"],
  year_label="1926"),

e("west-bcg-vaccine", "west", 1921,
  "卡介苗（BCG）",
  "卡尔梅特与介林研制的卡介苗1920年代开始用于结核预防，成为全球使用最广的疫苗之一。",
  people=["Albert Calmette", "Camille Guérin"], tags=["疫苗","结核"], confidence="high",
  sources=["wikipedia:Timeline_of_medicine"],
  year_label="约1921"),

e("west-yellow-fever-vaccine", "west", 1937,
  "黄热病疫苗",
  "马克斯·泰勒等1930年代研制黄热病减毒疫苗（17D株约1937），显著降低热带地区黄热病负担。",
  people=["Max Theiler"], tags=["疫苗","黄热病","热带医学"], confidence="high",
  sources=["wikipedia:Timeline_of_medicine"],
  year_label="约1937"),

e("west-waksman-streptomycin", "west", 1943,
  "瓦克斯曼链霉素",
  "塞尔曼·瓦克斯曼实验室1943年发现链霉素，是首个有效抗结核抗生素，1952年瓦克斯曼获诺贝尔奖。",
  people=["Selman Waksman", "Albert Schatz"], tags=["抗生素","结核"], confidence="high",
  sources=["Nobel archives"],
  year_label="1943"),

e("west-hench-cortisone", "west", 1949,
  "可的松用于类风湿关节炎",
  "菲利普·亨奇等1940年代末将可的松用于类风湿关节炎，开启糖皮质激素治疗时代。",
  people=["Philip Hench", "Edward Kendall"], tags=["激素","风湿","药物"], confidence="high",
  sources=["Nobel archives"],
  year_label="约1949"),

e("west-hibb-salk-trial", "west", 1954,
  "索尔克疫苗大规模现场试验",
  "1954年美国开展史上最大规模之一的脊灰疫苗现场试验，次年批准使用。",
  people=["Jonas Salk"], tags=["疫苗","脊灰","试验"], confidence="high",
  sources=["wikipedia:Timeline_of_medicine"],
  year_label="1954"),

e("west-oral-contraceptive", "west", 1960,
  "口服避孕药获批",
  "1960年复方口服避孕药在美国获批，深刻改变生殖健康、女性医疗与社会史。",
  tags=["生殖","药物","内分泌"], confidence="high",
  sources=["wikipedia:Timeline_of_medicine"],
  year_label="1960"),

e("west-measles-vaccine", "west", 1963,
  "麻疹疫苗",
  "1963年麻疹疫苗上市，后纳入MMR，显著降低儿童麻疹死亡率。",
  tags=["疫苗","儿科","麻疹"], confidence="high",
  sources=["wikipedia:Timeline_of_medicine"],
  year_label="1963"),

e("west-favaloro-bypass", "west", 1967,
  "法瓦罗罗冠状动脉旁路移植",
  "雷内·法瓦罗罗1967年发展冠状动脉旁路移植术（CABG），成为缺血性心脏病主要外科疗法。",
  people=["René Favaloro"], tags=["心脏","外科","血管"], confidence="high",
  sources=["wikipedia:Timeline_of_medicine"],
  year_label="1967"),

e("west-pacemaker-implant", "west", 1958,
  "植入式心脏起搏器",
  "约1958年埃尔姆奎斯特与森宁等实现植入式起搏器，开启心脏电生理器械治疗。",
  people=["Rune Elmqvist", "Åke Senning"], tags=["心脏","器械","起搏"], confidence="high",
  sources=["wikipedia:Timeline_of_medicine"],
  year_label="1958"),

e("west-ultrasound-medical", "west", 1953,
  "医学超声心动图萌芽",
  "英格·埃德勒等1950年代发展超声心动图，医学超声随后扩展至产科与腹部成像。",
  people=["Inge Edler"], tags=["影像","超声"], confidence="high",
  sources=["wikipedia:Timeline_of_medicine"],
  year_label="约1953"),

e("west-human-insulin-recombinant", "west", 1982,
  "重组人胰岛素上市",
  "1982年重组人胰岛素获批，是基因工程药物进入临床的标志。",
  tags=["生物技术","糖尿病","药物"], confidence="high",
  sources=["wikipedia:Timeline_of_medicine"],
  year_label="1982"),

e("west-hepatitis-a-vaccine", "west", 1992,
  "甲肝疫苗可用",
  "1992年前后甲型肝炎疫苗投入使用，完善病毒性肝炎免疫预防。",
  tags=["疫苗","肝炎"], confidence="high",
  sources=["wikipedia:Timeline_of_medicine"],
  year_label="约1992"),

e("west-palmaz-stent", "west", 1988,
  "帕尔马兹血管支架",
  "胡利奥·帕尔马兹等发展血管内支架，介入心脏病学进入支架时代。",
  people=["Julio Palmaz"], tags=["心脏","介入","器械"], confidence="high",
  sources=["wikipedia:Timeline_of_medicine"],
  year_label="约1988"),

e("west-chadwick-sanitary", "west", 1842,
  "查德威克《卫生状况报告》",
  "埃德温·查德威克1842年报告推动英国卫生改革立法，将清洁供水与排污纳入国家责任。",
  people=["Edwin Chadwick"], tags=["公共卫生","制度"], confidence="high",
  sources=["History of public health"],
  year_label="1842"),

e("west-halsted-surgical-school", "west", 1890,
  "霍尔斯特德外科原则",
  "威廉·霍尔斯特德在约翰斯·霍普金斯推行严格消毒、轻柔操作与住院医师制度，塑造现代外科训练。",
  people=["William Halsted"], tags=["外科","教育","美国"], confidence="high",
  sources=["Surgery history"],
  year_label="约1890"),

e("west-carrel-vascular-suture", "west", 1902,
  "卡雷尔血管缝合术",
  "亚历克西斯·卡雷尔发展血管吻合技术，为器官移植与血管外科奠基，1912年获诺贝尔奖。",
  people=["Alexis Carrel"], tags=["外科","血管","移植"], confidence="high",
  sources=["Nobel archives"],
  year_label="约1902"),

# ---- more EAST ----
e("east-yiyin-tangye-legend", "east", -1600,
  "伊尹制汤液（传说）",
  "传统将汤液（煎剂）发明归于商初伊尹。此为传说，反映早期食药与煎煮疗法的文化记忆，精确年代不可考。",
  people=["伊尹（传说）"], tags=["汤液","传说","商代"], confidence="low",
  sources=["国家中医药博物馆", "传统医史叙述"],
  year_label="传说约前1600"),

e("east-shangshu-yao-mingxuan", "east", -1000,
  "《尚书》药弗瞑眩",
  "《尚书·说命》有“若药弗瞑眩，厥疾弗瘳”之语，常被引为早期药力观念的文献证据（文本年代有讨论）。",
  works=["尚书"], tags=["文献","药性","周代"], confidence="low",
  sources=["国家中医药博物馆"],
  year_label="约前1000"),

e("east-zhang-qian-drugs", "east", -119,
  "张骞通西域与药物交流",
  "张骞两次出使西域（前138、前119），传统认为促进葡萄、苜蓿等物种及药物知识交流，丰富本草来源。",
  people=["张骞"], tags=["交流","本草","西汉"], confidence="medium",
  sources=["国家中医药博物馆"],
  year_label="前119"),

e("east-wuwei-medical-slips", "east", -50,
  "武威汉代医简",
  "甘肃武威旱滩坡等地出土东汉医简，载临床方药与针刺内容，补充河西地区汉代医疗实践。",
  archaeology=True, tags=["考古","汉简","方剂"], confidence="high",
  sources=["UCL Lo Laoguanshan context", "武威医简研究"],
  year_label="约公元1世纪", year_end=100),

e("east-shiliao-bencao", "east", 730,
  "《食疗本草》",
  "约713–741年孟诜《食疗本草》系统整理食物药用，体现唐代食疗传统。",
  people=["孟诜"], works=["食疗本草"],
  tags=["食疗","本草","唐代"], confidence="high",
  sources=["国家中医药博物馆"],
  year_label="约730"),

e("east-linshang-xuduan", "east", 845,
  "《理伤续断方》",
  "约841–845年蔺道人《理伤续断方》专论骨折伤科，是中医骨伤科重要早期专书。",
  people=["蔺道人"], works=["理伤续断方"],
  tags=["骨伤","外科","唐代"], confidence="high",
  sources=["国家中医药博物馆"],
  year_label="约845"),

e("east-kou-zongshi-yanyi", "east", 1116,
  "寇宗奭《本草衍义》",
  "寇宗奭约1116年著《本草衍义》，强调鉴别与药性辨析，补充《证类本草》。",
  people=["寇宗奭"], works=["本草衍义"],
  tags=["本草","宋代"], confidence="high",
  sources=["TCM bibliographic tradition"],
  year_label="约1116"),

e("east-xu-shuwei-shanghan", "east", 1132,
  "许叔微伤寒著作",
  "许叔微南宋初年著《伤寒百证歌》等，推动《伤寒论》歌赋化与临床普及。",
  people=["许叔微"], works=["伤寒百证歌"],
  tags=["伤寒","宋代"], confidence="high",
  sources=["Song medicine historiography"],
  year_label="约1132"),

e("east-li-shizhen-qijing", "east", 1577,
  "《奇经八脉考》",
  "李时珍1577年著《奇经八脉考》，系统考订奇经理论，与《濒湖脉学》同为脉系重要著作。",
  people=["李时珍"], works=["奇经八脉考"],
  tags=["经络","明代","脉学"], confidence="high",
  sources=["Routledge TCM Song-Qing"],
  year_label="1577"),

e("east-fu-qingzhu-fuke", "east", 1827,
  "傅青主妇科传本",
  "托名或传自傅山的《傅青主女科》清中后期广泛刊行，对妇科辨证处方影响极大。",
  people=["傅山"], works=["傅青主女科"],
  tags=["妇科","清代"], confidence="medium",
  sources=["Qing medical publishing"],
  year_label="约1827"),

e("east-wang-mengying-wenre", "east", 1852,
  "王孟英《温热经纬》",
  "王士雄（孟英）1852年辑《温热经纬》，整理叶薛吴等温病学说，是晚清温病学重要选本。",
  people=["王孟英"], works=["温热经纬"],
  tags=["温病","清代"], confidence="high",
  sources=["Wenbing historiography"],
  year_label="1852"),

e("east-cheng-guopeng-xinwu", "east", 1732,
  "程国彭《医学心悟》",
  "程国彭1732年著《医学心悟》，以八纲与汗吐下和消清温补概括治法，影响临床教学。",
  people=["程国彭"], works=["医学心悟"],
  tags=["临床","治法","清代"], confidence="high",
  sources=["Qing clinical texts"],
  year_label="1732"),

e("east-macao-western-hospital", "east", 1569,
  "澳门出现西式医院",
  "1569年前后澳门出现西式医院，标志西医机构进入中国沿海，开启近代中西医相遇的空间。",
  tags=["交流","医院","明代"], confidence="high",
  sources=["国家中医药博物馆"],
  year_label="约1569"),

e("east-cowpox-guangzhou", "east", 1805,
  "牛痘法传入广州",
  "1805年牛痘接种经澳门/广州传入中国，逐渐替代人痘，是免疫史与中西医交流的重要节点。",
  tags=["疫苗","天花","交流"], confidence="high",
  sources=["国家中医药博物馆"],
  year_label="1805"),

e("east-parker-boji-hospital", "east", 1835,
  "伯驾广州眼科医局（博济前身）",
  "美国传教士医生伯驾1835年在广州开设眼科医局，后发展为博济医院，是中国近代西医院先驱。",
  people=["Peter Parker"], tags=["医院","西医传入","眼科"], confidence="high",
  sources=["国家中医药博物馆"],
  year_label="约1835"),

e("east-shanghai-tcm-school-1917", "east", 1917,
  "上海中医专门学校开学",
  "1917年上海中医专门学校开学，代表近代中医学校教育对传统师承的补充。",
  tags=["教育","近代"], confidence="high",
  sources=["国家中医药博物馆"],
  year_label="1917"),

e("east-yun-tieqiao-defense", "east", 1922,
  "恽铁樵《群经见智录》",
  "恽铁樵1922年著《群经见智录》批驳余云岫《灵素商兑》，是近代中医理论自卫的重要文献。",
  people=["恽铁樵", "余云岫"], works=["群经见智录"],
  tags=["论争","近代","理论"], confidence="high",
  sources=["国家中医药博物馆"],
  year_label="1922"),

e("east-zhongyisi-1954", "east", 1954,
  "卫生部中医司成立",
  "1954年卫生部成立中医司，中央批转改进中医工作报告，中医行政管理强化。",
  tags=["制度","政策","现代"], confidence="high",
  sources=["国家中医药博物馆"],
  year_label="1954"),

e("east-tcm-textbooks-1960", "east", 1960,
  "中医学院试用教材出版",
  "1960年左右17种中医学院试用教材出版，统一高等中医教学内容与术语。",
  tags=["教育","教材","现代"], confidence="high",
  sources=["国家中医药博物馆"],
  year_label="约1960"),

e("east-who-acupuncture-centers-1975", "east", 1975,
  "北京南京上海国际针灸培训中心",
  "1975年应WHO要求，北京、南京、上海成立国际针灸培训中心，推动针灸全球化教学。",
  tags=["针灸","国际","WHO","教育"], confidence="high",
  sources=["国家中医药博物馆"],
  year_label="1975"),

e("east-health-policy-1997", "east", 1997,
  "卫生工作方针明确“中西医并重”",
  "1997年《中共中央国务院关于卫生改革与发展的决定》提出“中西医并重”等新时期卫生方针。",
  tags=["政策","现代"], confidence="high",
  sources=["国家中医药博物馆"],
  year_label="1997"),

e("east-small-splint-fracture", "east", 1970,
  "小夹板治疗骨折推广",
  "约1970年全国中草药与新医疗法展览等场合推广小夹板固定治疗骨折，体现中西医结合骨伤特色。",
  tags=["骨伤","中西医结合","现代"], confidence="medium",
  sources=["国家中医药博物馆"],
  year_label="约1970"),

e("east-cma-1915", "east", 1915,
  "中华医学会成立",
  "1915年中华医学会成立并创刊《中华医学杂志》，主要推动现代西医学在中国的职业化（与中医界并行）。",
  tags=["学会","近代","西医在华"], confidence="high",
  sources=["国家中医药博物馆"],
  year_label="1915"),

e("east-wenbing-yue-li", "east", 1799,
  "俞根初《通俗伤寒论》",
  "俞根初约1799年《通俗伤寒论》倡导寒温融合，反映明清伤寒与温病对话。",
  people=["俞根初"], works=["通俗伤寒论"],
  tags=["伤寒","温病","清代"], confidence="high",
  sources=["国家中医药博物馆"],
  year_label="约1799"),

e("east-puji-fang", "east", 1406,
  "《普济方》成书",
  "明永乐年间《普济方》成书，卷帙浩繁，是中国古代最大型方书之一。",
  works=["普济方"], tags=["方剂","明代"], confidence="high",
  sources=["江西中医药大学史料"],
  year_label="约1406"),

e("east-yiti-tang-yihui", "east", 1568,
  "一体堂宅仁医会",
  "1568年一体堂宅仁医会创办，是明代医师结社交流的早期例证。",
  tags=["学会","明代"], confidence="medium",
  sources=["国家中医药博物馆"],
  year_label="1568"),
]

added = 0
for item in extra:
    if item["id"] in existing:
        continue
    data["events"].append(item)
    existing.add(item["id"])
    added += 1

data["events"].sort(key=lambda x: (x["year"], x["yearEnd"] if x["yearEnd"] is not None else x["year"], x["side"], x["id"]))
data["meta"]["eventCount"] = len(data["events"])
data["meta"]["westCount"] = sum(1 for x in data["events"] if x["side"] == "west")
data["meta"]["eastCount"] = sum(1 for x in data["events"] if x["side"] == "east")
data["meta"]["updated"] = "2026-10-17"

path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
print(f"Added {added}; Total {data['meta']['eventCount']} (west {data['meta']['westCount']}, east {data['meta']['eastCount']})")
