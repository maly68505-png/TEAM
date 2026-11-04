# Builds client.html: clean client-facing storyboard (29 scenes), no internal notes.
import html, os
D = os.path.dirname(os.path.abspath(__file__))

A, B = 'A', 'B'
S = [
 (1,'قطر والاتصال بالجد','00:00 – 00:18',A,'الطفل','جدّي، هل أستطيع أن أرى المكان الذي تحكي عنه؟',['WIDE','MEDIUM','CLOSE'],'متوسطة قرب النافذة ثم اقتراب على الوجه','صوت الجد عبر المكالمة، المدينة ليلًا','من وجه الجد على الشاشة إلى وجهه شابًا في الصورة القديمة'),
 (2,'صورة الذاكرة','00:18 – 00:30',A,'الراوي','خرج يبحث عن السودان الذي عرفه جدّه.',['INSERT','OVER-SHOULDER','MACRO'],'قريبة على الصورة واليدين','ورق، ونَفَس الطفل','اليد تضع الصورة وتنفتح على البذرة'),
 (3,'البذرة وسؤال البداية','00:30 – 00:40',A,'الطفل','من أين نبدأ؟',['MACRO','MEDIUM','CLOSE'],'تفصيل البذرة ثم الدفتر','النواة، سحّاب الحقيبة، القلم','غلاف الدفتر ينغلق ويكشف المطار'),
 (4,'السفر من قطر','00:40 – 00:50',B,'الراوي','حمل صورة، ودفترًا، وبذرة صغيرة.',['WIDE','MEDIUM','POV'],'تتبّع هادئ مع الطفل وأمه','المطار، ثم هواء فناء البيت','النيل من نافذة الطائرة يصبح الخيط بين يدي الجد'),
 (5,'عند باب البيت','00:50 – 01:05',B,'الطفل','هل نجد كلّ شيء كما تركناه؟',['WIDE','TWO-SHOT','MACRO'],'ثنائية ثم نظرة إلى الفناء','ريح، صرير الباب، صمت اللقاء','من عتبة البيت إلى عتبة المدرسة'),
 (6,'المدرسة الصامتة','01:05 – 01:15',A,'الراوي','انقطع أطفال عن مدارسهم وأصدقائهم.',['WIDE','MEDIUM','CLOSE'],'ثابتة على المقاعد الخالية','ضحكات بعيدة تتلاشى','صوت الأدوات يسبق الصورة'),
 (7,'إصلاح باب البيت','01:15 – 01:30',B,'الجد','ستحتاج أشياء كثيرة إلى أيدينا.',['WIDE','MEDIUM','MACRO'],'أيدي الكبار والطفل يساعد','الأدوات اليدوية والجيران','الباب يُفتح على الكاميرا ويكشف سواكن'),
 (8,'البحر وسواكن','01:30 – 01:44',B,'الطفل','ماذا تحبّ أن يعرف الزائر عن هذا المكان؟',['WIDE','TWO-SHOT','MACRO'],'واسعة للمكان ثم الطفل والمرشد','أمواج وخطوات','خرزة المرجان تصبح قبة جبل التاكا'),
 (9,'كسلا وجبل التاكا','01:44 – 01:56',B,'الراوي','ما الذي يربط الإنسان بمكانه مهما ابتعد؟',['WIDE','MEDIUM','OVER-SHOULDER'],'واسعة للجبال ثم الرسم في الدفتر','ريح، القلم على الورق','الريح تقلب الصفحة وتكشف جبل مرة'),
 (10,'جبل مرة ودارفور','01:56 – 02:10',B,'الطفل','ما الذي تحتاج إليه الحياة هنا كي تزدهر من جديد؟',['WIDE','TRACKING','MACRO'],'واسعة ثم تتبّع على المسار','ماء وطيور','الجري يستمر في جبال النوبة'),
 (11,'جبال النوبة','02:10 – 02:24',B,'الطفل','ما الذي تحبّ أن أعرفه عن حياتكم هنا؟',['WIDE','MEDIUM','MACRO'],'مجموعة على مستوى نظر الطفل','أصوات الأهالي والأطفال','هبّة غبار تكشف مروي'),
 (12,'مروي والذاكرة','02:24 – 02:38',B,'الجد','ماذا نستطيع أن نترك لمن سيأتون بعدنا؟',['WIDE','MEDIUM','OVER-SHOULDER'],'واسعة للآثار ثم رسم الطفل','ريح خفيفة','بصمة إصبعه تصبح حقول الضفة'),
 (13,'المزارعة تبدأ الموسم','02:38 – 02:56',B,'الطفل','ما الذي تحتاجين إليه لتبدئي الموسم بثقة؟',['DRONE','CLOSE','MACRO'],'وجه المزارعة ثم اليدان والتربة','ماء القنوات، صوتها','الأيدي في التربة ثم الماء على الشتلة'),
 (14,'الطفل يرعى الشتلة','02:56 – 03:08',B,'الراوي','وفي الحقل، عرف أن الحياة تحتاج إلى رعاية.',['MACRO','MEDIUM','MACRO'],'قريبة على الماء والشتلة','ماء يُسكب','دوائر الماء تقود إلى المرعى'),
 (15,'الثروة الحيوانية','03:08 – 03:20',B,'الطفل','كيف نحفظ رزق الناس والأرض التي تجمعهم؟',['WIDE','TWO-SHOT','MACRO'],'واسعة للقطيع ثم الراعي والطفل','القطيع والماء','غبار القطيع يكشف المنجم'),
 (16,'التعدين والموارد','03:20 – 03:32',B,'الطفل','كيف تتحوّل ثروة الأرض إلى حياة أفضل لأهلها؟',['WIDE','TWO-SHOT','MACRO'],'تفصيل العيّنة ثم الموقع من بعيد','ريح ومحركات بعيدة','حبيبات الصخر تصبح خشب الورشة'),
 (17,'صاحب الورشة يفتح بابه','03:32 – 03:50',B,'الطفل','ما أوّل عمل بدأت به حين عدت إلى مهنتك؟',['MEDIUM','WIDE','CLOSE'],'متوسطة للحرفي وفتح الباب','أبواب خشب، غبار، صوته','نقطع إلى يد الطفل على الخشب'),
 (18,'الطفل يتعلّم حرفة','03:50 – 04:04',B,'الطفل','هل تعلّمني شيئًا أستطيع أن أبدأ به؟',['TWO-SHOT','MACRO','MACRO'],'ثنائية ثم اليدان','الصنفرة، ضحكة الحرفي','الخرزة الخشبية ثم الطين الدوّار'),
 (19,'التراث وصناعة الفخار','04:04 – 04:16',B,'الطفل','ما الحكاية التي تحملها هذه الصنعة؟',['CLOSE','CLOSE','MEDIUM'],'قريبة للصنعة ثم وجه الحرفية','الطين، صوتها وهي تحكي','إيقاع الطين يصبح إيقاع الطبل'),
 (20,'رقصة تجمع الأجيال','04:16 – 04:30',B,'الطفل','هل تعلّمني خطوة واحدة ونؤدّيها معًا؟',['WIDE','CLOSE','MEDIUM'],'واسعة للحركة ثم تفصيل الإيقاع','طبول حيّة وتصفيق','الخطوة تهدأ على حصيرة الرسم'),
 (21,'طفلان وصفحة واحدة','04:30 – 04:48',B,'الراوي','كلما أضاف رسمًا إلى دفتره، أضاف إنسانًا إلى قلبه.',['TWO-SHOT','TOP-DOWN','MACRO'],'ثنائية ثم صفحة مشتركة','ضحك خافت، القلم','الصفحة تُغلق والكرة تتدحرج'),
 (22,'اللعبة المشتركة','04:48 – 04:58',B,'الطفل','كيف نستقبل صديقًا جديدًا؟',['TRACKING','MACRO','MEDIUM'],'تتبّع خفيف على مستوى الأطفال','ضحك وركلات الكرة','من الشارع إلى الفصل'),
 (23,'المعلّمة تجهّز الفصل','04:58 – 05:16',B,'الطفل','ما الذي تتمنّين أن يعود إلى حياة الأطفال؟',['MEDIUM','WIDE','CLOSE'],'متوسطة للمعلّمة ثم ترتيب المقاعد','نوافذ تُفتح، طباشير','الباب يمتلئ بالأطفال'),
 (24,'المدرسة تستعيد أصواتها','05:16 – 05:32',B,'الراوي','وفي الورشة والمدرسة، رأى الغد يُصنع أمامه.',['MEDIUM','WIDE','CLOSE'],'من الباب إلى الفصل','قراءة جماعية بصوت عالٍ','وجوه الأطفال واحدًا واحدًا'),
 (25,'أحلام الأطفال','05:32 – 05:50',B,'الطفل','ماذا تريد أن تستطيع فعله في بلدك؟',['CLOSE','CLOSE','CLOSE'],'قريبة متبادلة لوجوه الأطفال','إجاباتهم بأصواتهم','إلى ظل الشجرة'),
 (26,'الأهالي والجيش','05:50 – 06:02',B,'الطفل','ماذا تتمنّى لأطفال السودان؟',['WIDE','MEDIUM','MACRO'],'لقاء إنساني سلمي','شاي، أصوات هادئة','كوب الشاي ثم ضوء المصباح ليلًا'),
 (27,'الصفحة الأخيرة','06:02 – 06:14',A,'الراوي','وحين عاد، كانت الصفحة الأخيرة تنتظره.',['TOP-DOWN','CLOSE','OVER-SHOULDER'],'تفصيل الدفتر والقلم','القلم، اللمبة','كلمة «غدًا» ثم ضوء الصباح على التراب'),
 (28,'الزرع الجماعي','06:14 – 06:38',B,'الراوي','ثم انحنى إلى الأرض، وزرع ما حمله طوال الطريق.',['MACRO','MEDIUM','WIDE'],'تبدأ باليدين وتتّسع للطفلين والجد','ماء يُسكب، ريح خفيفة','الخيط على الشتلة ثم العلم في ساحة المدرسة'),
 (29,'الاستقلال والغد','06:38 – 07:00',B,'الراوي','وطنٌ ينبت فينا… ويكبر بما نصنعه معًا.',['OVER-SHOULDER','CLOSE','DRONE'],'ختام بوجوه الأطفال والعلم','أصوات الناس، ثم سكون','شارة الذكرى 71'),
]
SHOT_AR = {'WIDE':'واسعة','MEDIUM':'متوسطة','CLOSE':'قريبة','MACRO':'ماكرو','INSERT':'تفصيل','OVER-SHOULDER':'من فوق الكتف','POV':'من عين الطفل','TWO-SHOT':'ثنائية','TRACKING':'تتبّع','DRONE':'جوية','TOP-DOWN':'من أعلى'}
ACTS = {1:('الفصل الأول','الرحيل والعودة'),8:('الفصل الثاني','الرحلة: الناس والأماكن'),17:('الفصل الثالث','الأيدي التي تبني الغد')}

def scene(n,t,tc,look,who,vo,shots,cam,snd,cut):
    imgs=''.join(f'<figure><img src="img/{n:02d}{x}.jpg" alt=""><figcaption>{SHOT_AR[s]}</figcaption></figure>' for x,s in zip('abc',shots))
    return f'''<section class="scene"><div class="head"><span class="num">{n:02d}</span><h2>{html.escape(t)}</h2><span class="tc">{tc}</span></div>
<p class="vo"><small>{who}</small>{html.escape(vo)}</p><div class="frames">{imgs}</div>
<dl class="notes"><div><dt>الكاميرا</dt><dd>{cam}</dd></div><div><dt>الصوت</dt><dd>{snd}</dd></div><div><dt>الانتقال</dt><dd>{cut}</dd></div></dl></section>'''

body=[]
for s in S:
    if s[0] in ACTS:
        a,b=ACTS[s[0]]; body.append(f'<section class="act"><div class="eyebrow">{a}</div><h2>{b}</h2></section>')
    body.append(scene(*s))

page=f'''<title>استقلال السودان 71 · ستوري بورد</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Reem+Kufi:wght@500;700&family=IBM+Plex+Sans+Arabic:wght@400;500;600&family=IBM+Plex+Mono:wght@400&display=swap">
<style>
:root{{--night:#0a1524;--line:#1f3149;--cream:#ece4d2;--muted:#94a0b2;--gold:#d6a446;
--display:"Reem Kufi","IBM Plex Sans Arabic",sans-serif;--body:"IBM Plex Sans Arabic",Tahoma,sans-serif;--mono:"IBM Plex Mono",monospace;color-scheme:dark}}
*{{box-sizing:border-box}}
body{{background:var(--night);color:var(--cream);font-family:var(--body);font-size:16px;line-height:1.7;margin:0;
padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));padding-block:0 48px}}
.wrap{{max-width:1180px;margin:0 auto}}
.cover{{min-height:60vh;display:grid;align-content:center;gap:18px;padding-block:56px;border-bottom:1px solid var(--line)}}
.eyebrow{{font-family:var(--mono);font-size:12px;letter-spacing:.14em;color:var(--gold)}}
h1{{font-family:var(--display);font-weight:700;font-size:clamp(40px,7vw,76px);margin:0;line-height:1.1}}
h1 span{{color:var(--gold)}}
.lede{{max-width:60ch;color:var(--muted);margin:0;font-size:18px}}
.facts{{display:flex;flex-wrap:wrap;gap:8px 28px;font-family:var(--mono);font-size:13px;color:var(--muted)}}
.facts b{{color:var(--cream);font-weight:400}}
.thread{{height:2px;background:linear-gradient(90deg,transparent,var(--gold) 15%,var(--gold) 85%,transparent);opacity:.7}}
.act{{padding-block:44px 6px;display:grid;gap:4px}}
.act h2{{font-family:var(--display);font-weight:700;font-size:clamp(26px,4vw,38px);margin:0}}
.scene{{padding-block:28px 10px;border-top:1px solid var(--line);display:grid;gap:14px}}
.head{{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 16px}}
.num{{font-family:var(--mono);color:var(--gold)}}
.head h2{{font-family:var(--display);font-weight:500;font-size:clamp(22px,3vw,28px);margin:0}}
.tc{{font-family:var(--mono);font-size:13px;color:var(--muted);margin-inline-start:auto;direction:ltr}}
.vo{{margin:0;font-size:19px;border-inline-start:2px solid var(--gold);padding-inline-start:14px;max-width:65ch}}
.vo small{{display:block;font-size:12px;color:var(--muted)}}
.frames{{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}}
figure{{margin:0;display:grid;gap:6px;min-width:0}}
figure img{{width:100%;aspect-ratio:16/9;object-fit:cover;border-radius:3px;display:block;background:#000}}
figcaption{{font-size:12px;color:var(--muted)}}
.notes{{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px 24px;margin:0;font-size:14px}}
.notes dt{{color:var(--gold);font-size:12px}} .notes dd{{margin:0;color:var(--cream)}}
footer{{border-top:1px solid var(--line);margin-top:32px;padding-top:20px;color:var(--muted);font-size:13px}}
@media (max-width:720px){{.frames,.notes{{grid-template-columns:1fr}}.tc{{margin-inline-start:0}}}}
</style>
<div class="wrap" dir="rtl" lang="ar">
<section class="cover"><div class="eyebrow">STORYBOARD · 29 SCENES</div><h1>استقلال السودان <span>71</span></h1>
<p class="lede">طفل من الدوحة يحمل صورة جدّه ودفترًا وبذرة، ويعود إلى السودان. في كل مكان يزوره يضيف أحد الناس خيطًا أو خرزة إلى دفتره، وفي النهاية يزرع البذرة مع جدّه وصديقه.</p>
<div class="facts"><span>المدة <b>7:00</b></span><span>المشاهد <b>29</b></span><span>النسبة <b>16:9</b></span><span>الذكرى <b>1956 – 2027</b></span></div>
<div class="thread"></div></section>
{''.join(body)}
<footer>الصور تصورات بصرية للتخطيط، وليست توثيقًا للأماكن أو أرشيفًا تاريخيًا.</footer>
</div>'''
open(os.path.join(D,'client.html'),'w',encoding='utf-8').write(page)
print('ok', len(S))
