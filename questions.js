// Compass statements, version 6 (new group).
//
// Every statement has a stable id and feeds zero or more axes. The number on an axis says
// which way AGREEING pushes you and how strongly the statement counts:
//   e:  +1 = agreeing is economically right-wing,   -1 = left-wing
//   s:  +1 = agreeing is socially conservative,      -1 = progressive
//   h:  +1 = agreeing is hawkish (hard power),       -1 = dovish
//   a:  +1 = agreeing is authoritarian (state power over the individual), -1 = libertarian
//       (the optional second vertical axis; it reuses statements, so it needs no new ones)
//   u:  +1 = agreeing is pro-EU (more integration),     -1 = Eurosceptic
//   g:  +1 = agreeing puts the environment first,        -1 = growth and cheap energy first
//   n:  +1 = agreeing is nationalist (nation first),     -1 = globalist
//   p:  +1 = agreeing is anti-establishment / populist,  -1 = trusts the established institutions
//   (u, g, n and p are shown as bars under the compass)
//   0.5 means the statement counts half, because the link to that axis is weaker.
// A statement with no axis is only used to compare people and for "closest to you".
//
// IMPORTANT: result codes store answers in this exact order. New statements may only be ADDED AT
// THE END, together with a new entry in CODE_LENGTHS in app.js; old codes then still work, with the
// new statements unanswered. Never reorder or delete statements: that would misread old codes.
// The quiz shows statements grouped by section, whatever their position in this list.
// Rewording a statement is fine as long as its meaning stays the same.

window.COMPASS_SECTIONS = [
  "Foundations", "Economic values", "Economy", "State, law and liberty", "Nation, culture and migration",
  "Morality, bodies and family", "Environment, technology and science",
  "Foreign policy and security", "Israel and Palestine", "Europe", "Democracy and institutions"
];

window.COMPASS_QUESTIONS = [
  // ---------- Foundations ----------
  {id:"f01", sec:0, s: 1,   a:1, t:"Without firm rules and institutions, most people would behave badly."},
  {id:"f02", sec:0,         a:-0.5, t:"People have certain rights simply by being human, whatever the law of their country says."},
  {id:"f05", sec:0, e: 1,   t:"What people earn in a free market is, broadly, what they deserve."},
  {id:"f08", sec:0, e:-1,   t:"When governments step in to solve problems, they usually do more good than harm."},
  {id:"f09", sec:0, n:1, s: 1,   t:"We owe more to our fellow citizens than to people in other countries."},
  {id:"f10", sec:0, s: 1,   t:"Traditions deserve respect, even when we can no longer fully explain why they exist."},
  {id:"f11", sec:0, s:-1,   t:"Societies usually get better when they break with old customs."},
  {id:"f12", sec:0, s: 1,   t:"A society needs religion, or something like it, to keep shared moral values alive."},
  {id:"f13", sec:0, s:-1,   t:"Religious beliefs should play no part in making laws."},
  {id:"f15", sec:0, s:-1,   t:"Differences in outcomes between men and women, or between ethnic groups, are mostly caused by discrimination."},

  // ---------- Economy ----------
  {id:"e01", sec:2, e: 1,   t:"Private companies usually run services better than the state does."},
  {id:"e02", sec:2, e:-1,   t:"Railways should be run by the state rather than by private companies."},
  {id:"e04", sec:2, e:-1,   t:"The wealthiest should pay an annual tax on their total wealth, not just on their income."},
  {id:"e06", sec:2, e: 1,   t:"People who can work but turn down a suitable job should lose their benefits."},
  {id:"e07", sec:2, e:-1,   t:"Strong trade unions are good for a country."},
  {id:"e09", sec:2, e:-1,   t:"Minimum pay, whether set by law or by union agreements, should be raised substantially, even if some jobs are lost."},
  {id:"e13", sec:2, n:-0.5, e: 1,   t:"Free trade is good for us, even when some local industries lose out."},
  {id:"e15", sec:2, e:-1,   t:"The gap between rich and poor in my country is too large."},
  {id:"e16", sec:2, e: 1,   t:"Inheritance tax should be abolished."},
  {id:"e17", sec:2, e: 1,   t:"Governments should balance their budgets, even if that means cutting services people value."},

  // ---------- State, law and liberty ----------
  {id:"l01", sec:3, s:-1,   a:1, t:"Laws against hate speech are worth having, even if they limit free expression."},
  {id:"l02", sec:3, s:-1,   a:-1, t:"Private messaging apps should stay fully encrypted, even if that makes it harder to catch serious criminals."},
  {id:"l03", sec:3, s: 1,   a:1, t:"Police should be allowed to use live facial recognition cameras in public places."},
  {id:"l05", sec:3, s: 1,   a:1, t:"Prison sentences for serious crimes should be longer."},
  {id:"l06", sec:3, s:-1,   a:-1, t:"The main purpose of prison should be rehabilitation rather than punishment."},
  {id:"l10", sec:3, s: 1,   a:1, t:"Protesters who deliberately block roads should face tougher penalties."},

  // ---------- Nation, culture and migration ----------
  {id:"n01", sec:4, n:0.5, s: 1,   t:"Immigration to my country should be substantially reduced."},
  {id:"n02", sec:4, n:0.5, s: 1,   t:"People who move to a country should be expected to adopt its way of life."},
  {id:"n03", sec:4, n:-0.5, s:-1,   t:"A society where many cultures live side by side is richer for it."},
  {id:"n04", sec:4, n:1, s: 1,   t:"Patriotism is a virtue."},
  {id:"n05", sec:4, s:-1,   t:"A country's history should be examined critically rather than celebrated."},
  {id:"n06", sec:4, s:-1,   t:"Europe should take in refugees fleeing war, even in large numbers."},
  {id:"n08", sec:4, s:-1,   t:"Labour migration is good for my country's economy."},
  {id:"n10", sec:4, n:1, s: 1,   t:"Belonging to a nation is partly a matter of ancestry, not only of citizenship and culture."},
  {id:"n11", sec:4, s: 1,   a:1, t:"Face veils such as the burqa and niqab should be banned in public."},
  {id:"n12", sec:4, s:-1,   t:"Racism is still a serious problem in my country."},

  // ---------- Morality, bodies and family ----------
  {id:"m01", sec:5, s: 1,   a:1, t:"Abortion should be more restricted than it is today in my country."},
  {id:"m02", sec:5, s:-1,   a:-1, t:"Terminally ill adults should have the right to end their life with medical help."},
  {id:"m04", sec:5, s: 1,   t:"Whether someone is a man or a woman is determined by biological sex."},
  {id:"m05", sec:5, s:-1,   a:-0.5, t:"People should be able to change their legal gender without a medical diagnosis."},
  {id:"m09", sec:5, s:-1,   t:"Same-sex couples should have the same right to adopt as other couples."},
  {id:"m10", sec:5, s: 1,   t:"On average, men and women are naturally suited to different roles in society."},

  // ---------- Environment, technology and science ----------
  {id:"t01", sec:6, g:1, s:-1,   t:"Fighting climate change should come before economic growth."},
  {id:"t02", sec:6, g:-1, s: 1,   t:"Climate targets should be delayed if they push up energy bills."},
  {id:"t03", sec:6, s: 0.5, t:"My country should build new nuclear power stations."},
  {id:"t04", sec:6, g:1, s:-1,   t:"From 2035, only zero-emission new cars should be sold in the EU."},
  {id:"t05", sec:6, g:-1, s: 1,   a:-0.5, t:"Farmers should not be forced to shrink their herds to meet nature or climate targets."},

  // ---------- Foreign policy and security ----------
  {id:"p01", sec:7, h: 1,   t:"Europe should keep arming Ukraine for as long as it takes."},
  {id:"p02", sec:7, h:-1,   t:"Ukraine should accept losing some territory in exchange for a lasting peace."},
  {id:"p04", sec:7, h:-1,   t:"NATO's expansion eastwards helped provoke Russia's invasion of Ukraine."},
  {id:"p07", sec:8, h:-1, s:-0.5, t:"European countries should stop selling weapons to Israel."},
  {id:"p10", sec:7, h: 1,   t:"My country should spend at least 3.5% of its GDP on defence, even if that means less money for other things."},
  {id:"p12", sec:7, h:-1,   t:"Diplomacy and trade do more to keep the peace than military strength."},
  {id:"p16", sec:7, h:-1,   t:"The 2003 invasion of Iraq was a mistake."},

  // ---------- Europe ----------
  {id:"u01", sec:9, u:-1, s: 0.5, t:"Too many decisions are taken in Brussels; more power should return to national governments."},
  {id:"u02", sec:9, u:1, e:-1,   t:"Richer EU countries should permanently transfer money to poorer ones."},
  {id:"u03", sec:9, u:1, s:-0.5, t:"The EU should build a joint European army."},
  {id:"u05", sec:9, u:-1, s: 0.5, t:"Countries should be able to opt out of EU rules they disagree with, even if that means less influence."},
  {id:"u06", sec:9, u:1, s:-0.5, t:"National vetoes in EU foreign policy should be replaced by majority voting."},
  {id:"u07", sec:9, u:-1, s: 1,   t:"Brexit was the right decision for the United Kingdom."},

  // ---------- Democracy and institutions ----------
  {id:"d01", sec:10, p:1,         t:"Important national decisions should be settled by binding referendums."},
  {id:"d02", sec:10, n:0.5, s: 1,   a:1, t:"My country should leave the European Convention on Human Rights if that is needed to control migration."},
  {id:"d03", sec:10, p:-1,         t:"Some decisions, such as setting interest rates, are better left to independent experts than to elected politicians."},
  // ---------- Added October 2026: more economy (positions 101-127). Always append new statements here. ----------
  // Economic values
  {id:"v01", sec:1, e: 1,   t:"Private property is a basic right that the state should rarely override."},
  {id:"v02", sec:1, e:-1,   t:"A fair economy meets everyone's basic needs before anyone becomes very rich."},
  {id:"v11", sec:1, e: 1,   t:"When entrepreneurs get rich, society as a whole usually benefits too."},
  // Economy in practice
  {id:"e18", sec:2, e:-1,   t:"Healthcare should be paid for mainly through taxes rather than through insurance."},
  {id:"e20", sec:2, e:-1,   t:"University should be free for students, paid for by taxes."},
  {id:"e25", sec:2, e:-1,   t:"The top rate of income tax should be raised."},
  {id:"e26", sec:2, e: 1,   t:"Corporation tax should be cut to attract businesses."},
  // ---------- Added October 2026: Israel and Palestine, and more foreign policy (positions 128-158) ----------
  // Israel and Palestine
  {id:"i01", sec:8, s: 0.5, t:"Israel has the right to exist as a Jewish state."},
  {id:"i02", sec:8, s:-0.5, t:"Palestinians have the right to their own independent state."},
  {id:"i04", sec:8, s: 0.5, t:"Hamas's attack of 7 October 2023 is the main reason for the war in Gaza."},
  {id:"i05", sec:8, s:-0.5, t:"What Israel has done in Gaza amounts to genocide."},
  {id:"i06", sec:8, s:-0.5, t:"Israeli settlements in the West Bank should be dismantled."},
  {id:"i09", sec:8, s: 0.5, t:"Pro-Palestinian protests in Europe have too often crossed the line into antisemitism."},
  // More foreign policy and security
  {id:"p19", sec:7, h: 1,   t:"Ukraine should be allowed to strike military targets deep inside Russia with Western weapons."},
  {id:"p24", sec:7, h: 1,   t:"Iran must be stopped from getting nuclear weapons, by military force if necessary."},
  {id:"p27", sec:7, h:-1,   t:"Western countries should not interfere in other countries' internal affairs, even to protect human rights."},
  {id:"p28", sec:7, h: 1,   t:"The West should be willing to use military force to stop genocide or mass atrocities abroad."},
  {id:"j01", sec:3, s: 1,   a:1, t:"Police should be able to stop and search people in high-crime areas without needing a specific reason to suspect them."},
  {id:"j05", sec:3, s: 1,   a:0.5, t:"Foreign nationals who commit a serious crime should be deported after serving their sentence."},
  {id:"j09", sec:3, s:-1,   t:"Police in my country treat ethnic minorities unfairly."},
  {id:"j11", sec:3, s:-1,   t:"Some police funding should go to mental health and youth services instead."},
  {id:"j12", sec:3, s: 1,   a:1, t:"Teenagers who commit serious violent crimes should be tried and sentenced as adults."},
  {id:"j13", sec:3, s: 1,   a:1, t:"Carrying a knife in public without good reason should mean an automatic prison sentence."},
  {id:"j20", sec:3, s:-1,   a:-1, t:"Police officers who kill someone on duty should be prosecuted like anyone else."},
  {id:"x01", sec:1, e: 1,   t:"Capitalism has done more good than harm for ordinary people."},
  {id:"x03", sec:0, e: 0.5, t:"Communism deserves the same moral condemnation as fascism."},
  {id:"x04", sec:9, u:1, s:-1,   t:"The EU should become a federal state: a United States of Europe."},
  {id:"x07", sec:5, s: 1,   t:"Trans women should not compete in women's sports."},
  {id:"x09", sec:3,         a:1, t:"Social media should be banned for children under 16."},
  {id:"x14", sec:6, g:1, s:-0.5, t:"Flying should be taxed much more heavily, even if holidays abroad become a luxury."},
  {id:"x16", sec:4, n:1, s: 1,   t:"Western culture is better than most other cultures."},
  {id:"x17", sec:4, s:-1,   t:"Islam is compatible with European values."},
  {id:"x19", sec:2, e:-1,   t:"Every adult should receive a basic income from the state, whether they work or not."},
  {id:"x20", sec:5, s: 1,   t:"Governments should actively encourage people to have more children."},
  // ---------- Added October 2026: statements to tell the left wing apart, plus mirror-image right-wing ones to keep the centre in the middle (positions 201-221) ----------
  // Telling the left apart: how far, how fast, and by what means
  {id:"y01", sec:1, e:-1,   t:"Workers should own and run the companies they work in, instead of shareholders."},
  {id:"y08", sec:6, g:1, e:-0.5, t:"Rich countries should deliberately shrink their production and consumption to protect the planet."},
  {id:"y09", sec:7, h:-1,   t:"NATO should be dissolved."},
  {id:"y10", sec:4, n:-1, s:-1,   a:-1, t:"People should be free to live and work in any country they choose."},
  {id:"y11", sec:3, s:-1,   a:-1, t:"Prisons should be abolished and replaced by other ways of dealing with crime."},
  {id:"y12", sec:9, u:-0.5, e:-0.5, t:"The EU mainly serves big business rather than ordinary people."},
  // Mirror images of the statements above, so the extra left-wing statements do not pull the centre of the compass to the right
  {id:"z01", sec:2, e: 1,   t:"Most state-owned companies should be privatised."},
  {id:"z02", sec:2, e: 1,   t:"Employers should be free to pay whatever a worker agrees to, with no legal or union-agreed minimum."},
  {id:"z05", sec:6, g:-1, e: 0.5, t:"Economic growth should be the government's top priority."},
  {id:"z07", sec:7, h: 1,   t:"NATO should be strengthened and given a bigger role in the world."},

  // ---------- New group: more on the EU, plus extra axes ----------
  {id:"w01", sec:9, u: 1,   t:"My country is better off inside the EU than it would be outside it."},
  {id:"w02", sec:9, u:-1,   t:"My country should leave the European Union."},
  {id:"w04", sec:9, u: 1,   t:"Where EU law and national law clash, EU law should win."},
  {id:"w05", sec:9, u:-1,   t:"The EU should go back to being mainly a free-trade area."},
  {id:"w06", sec:9, u: 1,   t:"The United Kingdom should rejoin the EU."},
  {id:"w07", sec:9, u:-1,   t:"European integration has gone far enough; it should go no further."},
  {id:"w08", sec:9, u: 1,   t:"Small countries are safer inside strong EU institutions than on their own."},
  {id:"w09", sec:9, u: 1,   n:-1,   t:"I feel European first and attached to my own country second."},
  {id:"w10", sec:9, u: 1,   t:"The EU should cut funding to member states that break democratic rules."},
  {id:"w14", sec:9, u:-1,   t:"Leaving the EU would make my country richer in the long run."},
  {id:"g02", sec:6, g: 1,   t:"Nature should be protected even when that blocks new homes or roads."},
  {id:"g03", sec:6, g: 1,   t:"Wind and solar farms are worth having even when they change the landscape."},
  {id:"g04", sec:6, g:-1,   t:"The dangers of climate change are exaggerated."},
  {id:"g05", sec:6, g:-1,   e: 0.5, t:"Environmental rules have made it too hard to build things in my country."},
  {id:"g06", sec:6, g: 1,   t:"A carbon tax that makes petrol and heating noticeably dearer is justified."},
  {id:"g07", sec:6, g:-1,   t:"Cheap energy matters more than cutting emissions, whatever the source."},
  {id:"n13", sec:4, n: 1,   t:"National sovereignty matters more than international agreements."},
  {id:"n14", sec:4, n: 1,   t:"My country's interests should come before those of other countries."},
  {id:"n15", sec:4, n:-1,   t:"Big problems such as climate and pandemics need global institutions with real power."},
  {id:"n16", sec:4, n:-1,   t:"I am a citizen of the world first and of my country second."},
  {id:"n17", sec:4, n: 1,   t:"A country should protect its own industries and workers from foreign competition."},
  {id:"d06", sec:10, p: 1,  t:"Politicians and the media are out of touch with ordinary people."},
  {id:"d07", sec:10, p: 1,  t:"The political system in my country is rigged in favour of an elite."},
  {id:"d08", sec:10, p:-1,  t:"Most established news media can be trusted to report honestly."},
  {id:"d09", sec:10, p:-1,  t:"On matters of public policy, scientists and experts deserve more trust than ordinary opinion."},
  {id:"d10", sec:10, p: 1,  a: 1, t:"A strong leader who breaks the rules would do more good than a parliament that argues endlessly."},
  {id:"d11", sec:10, p:-1,  t:"Courts should be able to overrule elected governments that break the constitution."},
  {id:"d12", sec:10, p:-1,  t:"The established parties have, on the whole, run my country well."}
];
