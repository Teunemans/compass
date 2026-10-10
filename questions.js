// Compass statements, version 1.
//
// Every statement has a stable id and feeds zero or more axes. The number on an axis says
// which way AGREEING pushes you and how strongly the statement counts:
//   e:  +1 = agreeing is economically right-wing,   -1 = left-wing
//   s:  +1 = agreeing is socially conservative,      -1 = progressive
//   h:  +1 = agreeing is hawkish (hard power),       -1 = dovish
//   0.5 means the statement counts half, because the link to that axis is weaker.
// A statement with no axis is only used to compare people and for "closest to you".
//
// IMPORTANT: result codes store answers in this exact order. Never reorder, insert or
// delete statements without bumping CODE_VERSION in app.js, or old codes will be misread.
// Rewording a statement is fine as long as its meaning stays the same.

window.COMPASS_SECTIONS = [
  "Foundations", "Economy", "State, law and liberty", "Nation, culture and migration",
  "Morality, bodies and family", "Environment, technology and science",
  "Foreign policy and security", "Europe", "Democracy and institutions"
];

window.COMPASS_QUESTIONS = [
  // ---------- Foundations ----------
  {id:"f01", sec:0, s: 1,   t:"Without firm rules and institutions, most people would behave badly."},
  {id:"f02", sec:0,         t:"People have certain rights simply by being human, whatever the law of their country says."},
  {id:"f03", sec:0,         t:"Some things are wrong even when doing them would lead to better outcomes overall."},
  {id:"f04", sec:0, e: 1,   t:"You are free as long as nobody stops you, even if you lack the means to do what you want."},
  {id:"f05", sec:0, e: 1,   t:"What people earn in a free market is, broadly, what they deserve."},
  {id:"f06", sec:0, e:-1,   t:"Success in life depends more on luck than on effort."},
  {id:"f07", sec:0, e: 1,   t:"Unequal outcomes are not unfair, as long as everyone had a fair chance."},
  {id:"f08", sec:0, e:-1,   t:"When governments step in to solve problems, they usually do more good than harm."},
  {id:"f09", sec:0, s: 1,   t:"We owe more to our fellow citizens than to people in other countries."},
  {id:"f10", sec:0, s: 1,   t:"Traditions deserve respect, even when we can no longer fully explain why they exist."},
  {id:"f11", sec:0, s:-1,   t:"Societies usually get better when they break with old customs."},
  {id:"f12", sec:0, s: 1,   t:"A society needs religion, or something like it, to keep shared moral values alive."},
  {id:"f13", sec:0, s:-1,   t:"Religious beliefs should play no part in making laws."},
  {id:"f14", sec:0, s:-1,   t:"Life in Europe today is better, in almost every way, than it was fifty years ago."},
  {id:"f15", sec:0, s:-1,   t:"Differences in outcomes between men and women, or between ethnic groups, are mostly caused by discrimination."},

  // ---------- Economy ----------
  {id:"e01", sec:1, e: 1,   t:"Private companies usually run services better than the state does."},
  {id:"e02", sec:1, e:-1,   t:"Railways should be run by the state rather than by private companies."},
  {id:"e03", sec:1, e:-1,   t:"Electricity grids and gas pipelines should be publicly owned."},
  {id:"e04", sec:1, e:-1,   t:"The wealthiest should pay an annual tax on their total wealth, not just on their income."},
  {id:"e05", sec:1, e: 1,   t:"Taxes on work should be cut, even if that means less money for public services."},
  {id:"e06", sec:1, e: 1,   t:"People who can work but turn down a suitable job should lose their benefits."},
  {id:"e07", sec:1, e:-1,   t:"Strong trade unions are good for a country."},
  {id:"e08", sec:1, e: 1,   t:"It should be easier for employers to dismiss employees."},
  {id:"e09", sec:1, e:-1,   t:"The minimum wage should be raised substantially, even if some jobs are lost."},
  {id:"e10", sec:1, e:-1,   t:"Rent controls are a good way to keep housing affordable."},
  {id:"e11", sec:1, e: 0.5, t:"Planning rules should be loosened so far more homes can be built, even when neighbours object."},
  {id:"e12", sec:1, e: 1,   t:"The pension age should keep rising along with life expectancy."},
  {id:"e13", sec:1, e: 1,   t:"Free trade is good for us, even when some local industries lose out."},
  {id:"e14", sec:1, e:-1,   t:"Governments should subsidise strategic industries, such as chips and batteries, rather than leave them to the market."},
  {id:"e15", sec:1, e:-1,   t:"The gap between rich and poor in my country is too large."},
  {id:"e16", sec:1, e: 1,   t:"Inheritance tax should be abolished."},
  {id:"e17", sec:1, e: 1,   t:"Governments should balance their budgets, even if that means cutting services people value."},

  // ---------- State, law and liberty ----------
  {id:"l01", sec:2, s:-1,   t:"Laws against hate speech are worth having, even if they limit free expression."},
  {id:"l02", sec:2, s:-1,   t:"Private messaging apps should stay fully encrypted, even if that makes it harder to catch serious criminals."},
  {id:"l03", sec:2, s: 1,   t:"Police should be allowed to use live facial recognition cameras in public places."},
  {id:"l04", sec:2, s: 1,   t:"More police on the streets is the most effective way to reduce crime."},
  {id:"l05", sec:2, s: 1,   t:"Prison sentences for serious crimes should be longer."},
  {id:"l06", sec:2, s:-1,   t:"The main purpose of prison should be rehabilitation rather than punishment."},
  {id:"l07", sec:2, s: 1,   t:"The death penalty should be allowed for the most serious crimes."},
  {id:"l08", sec:2, s:-1,   t:"Cannabis should be legal and sold under regulation."},
  {id:"l09", sec:2, s:-1,   t:"Possessing a small amount of any drug for personal use should not be a crime."},
  {id:"l10", sec:2, s: 1,   t:"Protesters who deliberately block roads should face tougher penalties."},

  // ---------- Nation, culture and migration ----------
  {id:"n01", sec:3, s: 1,   t:"Immigration to my country should be substantially reduced."},
  {id:"n02", sec:3, s: 1,   t:"People who move to a country should be expected to adopt its way of life."},
  {id:"n03", sec:3, s:-1,   t:"A society where many cultures live side by side is richer for it."},
  {id:"n04", sec:3, s: 1,   t:"Patriotism is a virtue."},
  {id:"n05", sec:3, s:-1,   t:"A country's history should be examined critically rather than celebrated."},
  {id:"n06", sec:3, s:-1,   t:"Europe should take in refugees fleeing war, even in large numbers."},
  {id:"n07", sec:3, s: 1,   t:"Asylum claims should be processed in countries outside Europe."},
  {id:"n08", sec:3, s:-1,   t:"Labour migration is good for my country's economy."},
  {id:"n09", sec:3, s:-1,   t:"Employers should be allowed to favour candidates from under-represented groups when hiring."},
  {id:"n10", sec:3, s: 1,   t:"Belonging to a nation is partly a matter of ancestry, not only of citizenship and culture."},
  {id:"n11", sec:3, s: 1,   t:"Face veils such as the burqa and niqab should be banned in public."},
  {id:"n12", sec:3, s:-1,   t:"Racism is still a serious problem in my country."},

  // ---------- Morality, bodies and family ----------
  {id:"m01", sec:4, s: 1,   t:"Abortion should be more restricted than it is today in my country."},
  {id:"m02", sec:4, s:-1,   t:"Terminally ill adults should have the right to end their life with medical help."},
  {id:"m03", sec:4, s: 1,   t:"Euthanasia should never be allowed for mental suffering alone."},
  {id:"m04", sec:4, s: 1,   t:"Whether someone is a man or a woman is determined by biological sex."},
  {id:"m05", sec:4, s:-1,   t:"People should be able to change their legal gender without a medical diagnosis."},
  {id:"m06", sec:4, s:-1,   t:"Doctors should be allowed to prescribe puberty blockers to young people with gender dysphoria."},
  {id:"m07", sec:4, s:-1,   t:"Prostitution between consenting adults should be legal and regulated."},
  {id:"m08", sec:4, s: 1,   t:"Children do best when raised by their married mother and father."},
  {id:"m09", sec:4, s:-1,   t:"Same-sex couples should have the same right to adopt as other couples."},
  {id:"m10", sec:4, s: 1,   t:"On average, men and women are naturally suited to different roles in society."},

  // ---------- Environment, technology and science ----------
  {id:"t01", sec:5, s:-1,   t:"Fighting climate change should come before economic growth."},
  {id:"t02", sec:5, s: 1,   t:"Climate targets should be delayed if they push up energy bills."},
  {id:"t03", sec:5, s: 0.5, t:"My country should build new nuclear power stations."},
  {id:"t04", sec:5, s:-1,   t:"From 2035, only zero-emission new cars should be sold in the EU."},
  {id:"t05", sec:5, s: 1,   t:"Farmers should not be forced to shrink their herds to meet nature or climate targets."},
  {id:"t06", sec:5, s:-1,   t:"Animal welfare should limit how we farm, even if food becomes more expensive."},
  {id:"t07", sec:5,         t:"Governments should strictly regulate artificial intelligence, even if that slows innovation."},
  {id:"t08", sec:5, e: 0.5, t:"Rich countries still need economic growth to improve people's lives."},

  // ---------- Foreign policy and security ----------
  {id:"p01", sec:6, h: 1,   t:"Europe should keep arming Ukraine for as long as it takes."},
  {id:"p02", sec:6, h:-1,   t:"Ukraine should accept losing some territory in exchange for a lasting peace."},
  {id:"p03", sec:6, h: 1,   t:"European soldiers should be stationed in Ukraine to help guarantee a peace deal."},
  {id:"p04", sec:6, h:-1,   t:"NATO's expansion eastwards helped provoke Russia's invasion of Ukraine."},
  {id:"p05", sec:6, h: 1, s: 0.5, t:"Israel's war in Gaza after the attack of 7 October 2023 was justified."},
  {id:"p06", sec:6, s:-0.5, t:"European countries should recognise a Palestinian state."},
  {id:"p07", sec:6, h:-1, s:-0.5, t:"European countries should stop selling weapons to Israel."},
  {id:"p08", sec:6, h:-1,   t:"Taiwan's future is a matter for China and Taiwan, not for Europe."},
  {id:"p09", sec:6, h: 0.5, t:"Europe should stay closely allied with the United States, whoever is president."},
  {id:"p10", sec:6, h: 1,   t:"My country should spend at least 3.5% of its GDP on defence, even if that means less money for other things."},
  {id:"p11", sec:6, h: 1,   t:"Europe needs its own nuclear deterrent, independent of the United States."},
  {id:"p12", sec:6, h:-1,   t:"Diplomacy and trade do more to keep the peace than military strength."},
  {id:"p13", sec:6, h:-1,   t:"My country should only send soldiers to fight abroad if it or an ally has been attacked."},
  {id:"p14", sec:6, h: 1,   t:"The 1991 Gulf War to drive Iraq out of Kuwait was justified."},
  {id:"p15", sec:6, h: 1,   t:"NATO was right to bomb Serbia over Kosovo in 1999."},
  {id:"p16", sec:6, h:-1,   t:"The 2003 invasion of Iraq was a mistake."},

  // ---------- Europe ----------
  {id:"u01", sec:7, s: 0.5, t:"Too many decisions are taken in Brussels; more power should return to national governments."},
  {id:"u02", sec:7, e:-1,   t:"Richer EU countries should permanently transfer money to poorer ones."},
  {id:"u03", sec:7, s:-0.5, t:"The EU should build a joint European army."},
  {id:"u04", sec:7, s:-0.5, t:"The EU should admit new members such as Ukraine and the Western Balkan countries in the coming years."},
  {id:"u05", sec:7, s: 0.5, t:"Countries should be able to opt out of EU rules they disagree with, even if that means less influence."},
  {id:"u06", sec:7, s:-0.5, t:"National vetoes in EU foreign policy should be replaced by majority voting."},
  {id:"u07", sec:7, s: 1,   t:"Brexit was the right decision for the United Kingdom."},

  // ---------- Democracy and institutions ----------
  {id:"d01", sec:8,         t:"Important national decisions should be settled by binding referendums."},
  {id:"d02", sec:8, s: 1,   t:"My country should leave the European Convention on Human Rights if that is needed to control migration."},
  {id:"d03", sec:8,         t:"Some decisions, such as setting interest rates, are better left to independent experts than to elected politicians."},
  {id:"d04", sec:8, s: 1,   t:"Monarchies are worth keeping, in countries that have one."},
  {id:"d05", sec:8, s:-1,   t:"The voting age should be lowered to 16."}
];
