
const express=require("express"), cors=require("cors"), path=require("path");
require("dotenv").config();
const app=express();
app.use(cors());
app.use(express.json({limit:"2mb"}));
app.use(express.static(__dirname));

const PORT=process.env.PORT||3000;
const cache=new Map();
const getCache=(k,ttl)=>{const x=cache.get(k); return x&&Date.now()-x.t<ttl?x.v:null};
const setCache=(k,v)=>cache.set(k,{t:Date.now(),v});

async function fetchJson(url,opts={}){
  const r=await fetch(url,{...opts,headers:{"Accept":"application/json",...(opts.headers||{})}});
  if(!r.ok) throw new Error(`Upstream ${r.status}`);
  return r.json();
}

app.get("/api/health",(req,res)=>res.json({ok:true,service:"SunnyToolsPro API",time:new Date().toISOString()}));

app.get("/api/gold",async(req,res)=>{
  try{
    const key="gold"; const cached=getCache(key,60000); if(cached)return res.json(cached);
    const url=process.env.GOLD_API_URL||"https://api.gold-api.com/price/XAU";
    const j=await fetchJson(url);
    // gold-api.com commonly returns price in USD/oz; convert to AED with fixed AED/USD peg.
    let priceAED;
    if(j.price) priceAED=Number(j.price)*3.6725/31.1034768;
    else if(j.aed) priceAED=Number(j.aed)/31.1034768;
    else if(j.price_gram_24k) priceAED=Number(j.price_gram_24k);
    if(!priceAED) throw new Error("Unsupported gold response");
    const out={ok:true,currency:"AED",gram24k:priceAED,gram22k:priceAED*22/24,gram21k:priceAED*21/24,gram18k:priceAED*18/24,source:url,updatedAt:new Date().toISOString()};
    setCache(key,out); res.json(out);
  }catch(e){res.status(502).json({ok:false,error:e.message})}
});

app.get("/api/jobs",async(req,res)=>{
  try{
    const url=process.env.JOBS_API_URL||"https://api.jobdatapool.com/v1/jobs";
    const qs=new URLSearchParams({limit:"30"});
    if(req.query.q) qs.set("q",req.query.q);
    const j=await fetchJson(url+"?"+qs.toString(),process.env.JOBS_API_KEY?{headers:{"Authorization":"Bearer "+process.env.JOBS_API_KEY}}:{});
    const arr=j.jobs||j.data||j.results||[];
    const jobs=arr.map(x=>({title:x.title||x.name||"Job vacancy",company:x.company?.name||x.company||"",city:x.city||x.location?.city||x.location||"",country:x.country||x.location?.country||"",salary:x.salary||x.salary_range||"",url:x.url||x.apply_url||x.link||"#",time:x.published_at||x.created_at||""}))
      .filter(x=>/uae|united arab emirates|dubai|abu dhabi|sharjah|ajman|rak|ras al khaimah|fujairah|umm al quwain|al ain/i.test([x.city,x.country].join(" ")));
    res.json({ok:true,jobs:jobs.length?jobs:arr.slice(0,12).map(x=>({title:x.title||"Job vacancy",company:x.company?.name||x.company||"",city:x.city||x.location?.city||"",salary:x.salary||"",url:x.url||x.link||"#",time:x.published_at||""})),source:url});
  }catch(e){res.status(502).json({ok:false,error:e.message,jobs:[]})}
});

app.get("/api/news",async(req,res)=>{
  if(!process.env.NEWS_API_KEY) return res.status(503).json({ok:false,configured:false,error:"NEWS_API_KEY is not configured",articles:[]});
  try{
    const q=encodeURIComponent(req.query.q||"UAE Dubai Sharjah Abu Dhabi");
    const url=`https://newsapi.org/v2/everything?q=${q}&language=en&sortBy=publishedAt&pageSize=12&apiKey=${process.env.NEWS_API_KEY}`;
    const j=await fetchJson(url);
    res.json({ok:true,articles:(j.articles||[]).map(a=>({title:a.title,description:a.description,image:a.urlToImage,url:a.url,publishedAt:a.publishedAt,source:a.source?.name}))});
  }catch(e){res.status(502).json({ok:false,error:e.message,articles:[]})}
});

app.get("/api/rent",async(req,res)=>{
  if(!process.env.RENT_API_URL) return res.status(503).json({ok:false,configured:false,error:"RENT_API_URL is not configured",rooms:[]});
  try{
    const u=new URL(process.env.RENT_API_URL);
    if(req.query.city)u.searchParams.set("city",req.query.city);
    if(req.query.area)u.searchParams.set("area",req.query.area);
    if(req.query.type)u.searchParams.set("type",req.query.type);
    const headers={}; if(process.env.RENT_API_KEY)headers.Authorization="Bearer "+process.env.RENT_API_KEY;
    const j=await fetchJson(u.toString(),{headers});
    const arr=j.rooms||j.data||j.results||[];
    res.json({ok:true,rooms:arr.map(x=>({type:x.type||x.property_type||"Room",area:x.area||x.location||"",price:x.price||x.rent||"",meta:x.meta||x.description||"",url:x.url||x.link||"#"}))});
  }catch(e){res.status(502).json({ok:false,error:e.message,rooms:[]})}
});

app.use((req,res)=>res.sendFile(path.join(__dirname,"index.html")));
app.listen(PORT,()=>console.log(`SunnyToolsPro running on http://localhost:${PORT}`));
