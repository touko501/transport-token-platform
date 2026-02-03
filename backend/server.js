const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();
const app = express();
const PORT = process.env.PORT || 4000;
const JWT_SECRET = process.env.JWT_SECRET || 'transport-token-secret-key-2025';

app.use(cors({ origin: process.env.FRONTEND_URL || '*', credentials: true }));
app.use(express.json());

// ═══════════════════════════════════════════════════════════════════════════
// PRICING SERVICE - TRINÔME CNR
// ═══════════════════════════════════════════════════════════════════════════

const VEHICLES = {
  VELO_CARGO:       { ck: 0.10, cc: 15, cj: 50, co2: 0, speed: 20, capacityKg: 150 },
  SCOOTER_ELEC:     { ck: 0.15, cc: 15, cj: 50, co2: 0, speed: 30, capacityKg: 50 },
  VUL_ELECTRIQUE:   { ck: 0.55, cc: 26, cj: 125, co2: 0, speed: 60, capacityKg: 1200 },
  FOURGONNETTE:     { ck: 0.52, cc: 24, cj: 95, co2: 184, speed: 55, capacityKg: 800 },
  FOURGON_12M3:     { ck: 0.65, cc: 26, cj: 115, co2: 276, speed: 60, capacityKg: 1200 },
  FOURGON_20M3:     { ck: 0.78, cc: 28, cj: 135, co2: 322, speed: 65, capacityKg: 1800 },
  PORTEUR_7T5:      { ck: 0.92, cc: 32, cj: 185, co2: 414, speed: 70, capacityKg: 4500 },
  PORTEUR_12T:      { ck: 1.05, cc: 35, cj: 215, co2: 506, speed: 70, capacityKg: 7500 },
  PORTEUR_19T:      { ck: 1.18, cc: 38, cj: 245, co2: 580, speed: 70, capacityKg: 12000 },
  PORTEUR_ELEC:     { ck: 0.90, cc: 32, cj: 180, co2: 0, speed: 65, capacityKg: 7000 },
  SEMI_TAUTLINER:   { ck: 1.35, cc: 42, cj: 295, co2: 736, speed: 80, capacityKg: 24000 },
  SEMI_FRIGO:       { ck: 1.75, cc: 48, cj: 365, co2: 874, speed: 80, capacityKg: 22000 },
  SEMI_BENNE:       { ck: 1.40, cc: 43, cj: 305, co2: 750, speed: 75, capacityKg: 26000 },
  SEMI_CITERNE:     { ck: 1.50, cc: 45, cj: 325, co2: 780, speed: 75, capacityKg: 25000 },
  MEGA_TRAILER:     { ck: 1.45, cc: 44, cj: 310, co2: 700, speed: 80, capacityKg: 25000 },
  ELECTRIQUE_FOURGON: { ck: 0.55, cc: 26, cj: 125, co2: 0, speed: 60, capacityKg: 1200 },
};

const COUNTRIES = {
  FR: { tva: 20, toll: 0.15 }, DE: { tva: 19, toll: 0.35 }, BE: { tva: 21, toll: 0.12 },
  ES: { tva: 21, toll: 0.10 }, IT: { tva: 22, toll: 0.12 }, NL: { tva: 21, toll: 0.00 },
  GB: { tva: 20, toll: 0.05 }, PL: { tva: 23, toll: 0.08 }, PT: { tva: 23, toll: 0.08 },
  AT: { tva: 20, toll: 0.20 }, CH: { tva: 7.7, toll: 0.25 }, LU: { tva: 17, toll: 0.00 },
  CZ: { tva: 21, toll: 0.10 }, SE: { tva: 25, toll: 0.05 }, DK: { tva: 25, toll: 0.10 },
  NO: { tva: 25, toll: 0.15 }, FI: { tva: 24, toll: 0.05 },
};

// ═══════════════════════════════════════════════════════════════════════════
// GLEC FRAMEWORK v3.2 / ISO 14083:2023
// ═══════════════════════════════════════════════════════════════════════════

const GLEC = {
  road: {
    van_diesel: { wtw: 299, ttw: 245, wtt: 54 }, van_electric: { wtw: 24.8, ttw: 0, wtt: 24.8 },
    rigid_7t5: { wtw: 187, ttw: 153, wtt: 34 }, rigid_12t: { wtw: 130, ttw: 106, wtt: 24 },
    rigid_19t: { wtw: 101, ttw: 83, wtt: 18 }, rigid_electric: { wtw: 18.6, ttw: 0, wtt: 18.6 },
    artic_general: { wtw: 62, ttw: 51, wtt: 11 }, artic_frigo: { wtw: 81, ttw: 66, wtt: 15 },
    artic_mega: { wtw: 55, ttw: 45, wtt: 10 },
    cargo_bike: { wtw: 0, ttw: 0, wtt: 0 }, scooter_electric: { wtw: 0, ttw: 0, wtt: 0 },
  },
  fuels: {
    diesel_b7: { f: 1.00, l: "Diesel B7" }, hvo100: { f: 0.10, l: "HVO100" },
    b100: { f: 0.35, l: "Biodiesel B100" }, gnl: { f: 0.80, l: "GNL" },
    bio_gnl: { f: 0.15, l: "Bio-GNL" }, electric: { f: 0.00, l: "Électrique" },
    hydrogen: { f: 0.05, l: "Hydrogène vert" },
  },
  DAF: 1.05,
  elec: { FR:56, DE:385, BE:167, NL:386, IT:332, ES:206, PT:219, AT:107, CH:26, PL:700, SE:41, NO:19, DK:117, FI:97, CZ:421, GB:231, LU:100, EU:260 },
};

const V2G = {
  VELO_CARGO:"cargo_bike", SCOOTER_ELEC:"scooter_electric", VUL_ELECTRIQUE:"van_electric",
  FOURGONNETTE:"van_diesel", FOURGON_12M3:"van_diesel", FOURGON_20M3:"rigid_7t5",
  PORTEUR_7T5:"rigid_7t5", PORTEUR_12T:"rigid_12t", PORTEUR_19T:"rigid_19t",
  PORTEUR_ELEC:"rigid_electric", SEMI_TAUTLINER:"artic_general", SEMI_FRIGO:"artic_frigo",
  SEMI_BENNE:"artic_general", SEMI_CITERNE:"artic_general", MEGA_TRAILER:"artic_mega",
  ELECTRIQUE_FOURGON:"van_electric",
};

// ═══════════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371, dLat = (lat2-lat1)*Math.PI/180, dLon = (lon2-lon1)*Math.PI/180;
  const a = Math.sin(dLat/2)**2 + Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)**2;
  return Math.round(R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a))*1.3);
}

function calcPrice(p) {
  const v = VEHICLES[p.vehicleType] || VEHICLES.FOURGON_20M3;
  const d = haversine(p.pickupLat, p.pickupLon, p.deliveryLat, p.deliveryLon);
  let h = d/v.speed; h += Math.floor(h/4.5)*0.75+2; const days = Math.ceil(h/10);
  const ck=v.ck*d, cc=v.cc*h, cj=v.cj*days; let base=ck+cc+cj;
  const tolls = d*((( COUNTRIES[p.pickupCountry]||COUNTRIES.FR).toll+(COUNTRIES[p.deliveryCountry]||COUNTRIES.FR).toll)/2);
  let sur=0;
  if(p.isUrgent) sur+=base*0.50; if(p.isWeekend) sur+=base*0.35;
  if(p.isNight) sur+=base*0.20; if(p.isADR) sur+=base*0.25;
  let eco=0;
  if(p.ecoOption==='hvo') eco=(base+sur)*0.15; if(p.ecoOption==='electric') eco=(base+sur)*0.30;
  const pre=base+tolls+sur-eco, com=pre*0.10, ht=pre+com;
  const tr=(COUNTRIES[p.deliveryCountry]||COUNTRIES.FR).tva, tva=ht*(tr/100), ttc=ht+tva;
  const co2=(v.co2*d)/1000;
  let tt=50; if(p.ecoOption==='electric') tt+=30; else if(p.ecoOption==='hvo') tt+=15;
  tt-=Math.min(20,(co2/d)*30); tt=Math.max(0,Math.min(100,Math.round(tt)));
  return {
    distanceKm:d, estimatedHours:Math.round(h*10)/10, estimatedDays:days,
    trinome:{ck:Math.round(ck*100),cc:Math.round(cc*100),cj:Math.round(cj*100),total:Math.round(base*100)},
    tolls:Math.round(tolls*100), surcharges:Math.round(sur*100), ecoDiscount:Math.round(eco*100),
    commission:Math.round(com*100), priceHT:Math.round(ht*100), tvaRate:tr,
    tva:Math.round(tva*100), priceTTC:Math.round(ttc*100), co2Kg:Math.round(co2*10)/10, ttScore:tt,
  };
}

function calcGLEC(vt, dist, wKg, fuel, country) {
  const gt=V2G[vt]; if(!gt) return null;
  const ef=GLEC.road[gt], fu=GLEC.fuels[fuel||"diesel_b7"], wT=wKg/1000, ad=dist*GLEC.DAF;
  let ew=ef.wtw; if(fu) ew*=fu.f;
  if(gt.includes("electric")&&country){const cf=GLEC.elec[country]||GLEC.elec.EU; ew=ef.wtw*(cf/GLEC.elec.EU);}
  const tot=(ew*wT*ad)/1000, tR=ef.ttw/(ef.wtw||1), wR=ef.wtt/(ef.wtw||1);
  const rat=tot<10?"A+":tot<50?"A":tot<150?"B":tot<300?"C":tot<500?"D":"E";
  return { total:Math.round(tot*10)/10, ttw:Math.round(tot*tR*10)/10, wtt:Math.round(tot*wR*10)/10, perTkm:ew, rating:rat };
}

const CITIES = {
  'Paris':{lat:48.8566,lon:2.3522},'Lyon':{lat:45.764,lon:4.8357},'Marseille':{lat:43.2965,lon:5.3698},
  'Toulouse':{lat:43.6047,lon:1.4442},'Bordeaux':{lat:44.8378,lon:-0.5792},'Lille':{lat:50.6292,lon:3.0573},
  'Nantes':{lat:47.2184,lon:-1.5536},'Strasbourg':{lat:48.5734,lon:7.7521},'Nice':{lat:43.7102,lon:7.262},
  'Rennes':{lat:48.1173,lon:-1.6778},'Milan':{lat:45.4642,lon:9.19},'Madrid':{lat:40.4168,lon:-3.7038},
  'Berlin':{lat:52.52,lon:13.405},'Bruxelles':{lat:50.8503,lon:4.3517},'Amsterdam':{lat:52.3676,lon:4.9041},
  'Londres':{lat:51.5074,lon:-0.1278},'Barcelone':{lat:41.3851,lon:2.1734},'Rome':{lat:41.9028,lon:12.4964},
  'Munich':{lat:48.1351,lon:11.582},'Varsovie':{lat:52.2297,lon:21.0122},'Prague':{lat:50.0755,lon:14.4378},
  'Vienne':{lat:48.2082,lon:16.3738},'Zurich':{lat:47.3769,lon:8.5417},'Lisbonne':{lat:38.7223,lon:-9.1393},
};

// ═══════════════════════════════════════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════════════════════════════════════

function auth(req,res,next){
  const h=req.headers.authorization;
  if(!h||!h.startsWith('Bearer ')) return res.status(401).json({error:'Token manquant'});
  try{req.user=jwt.verify(h.split(' ')[1],JWT_SECRET);next();}
  catch(e){return res.status(401).json({error:'Token invalide'});}
}
function optAuth(req,res,next){
  const h=req.headers.authorization;
  if(h&&h.startsWith('Bearer ')){try{req.user=jwt.verify(h.split(' ')[1],JWT_SECRET);}catch(e){}}
  next();
}

// ═══════════════════════════════════════════════════════════════════════════
// ROUTES
// ═══════════════════════════════════════════════════════════════════════════

app.get('/health',(req,res)=>res.json({status:'ok',version:'3.0.0',platform:'Transport Token',features:['CNR','GLEC Carbon','AI Matching','Bidding','Ratings','Notifications'],timestamp:new Date().toISOString()}));

// ── AUTH ─────────────────────────────────────────────────────────────────

app.post('/api/auth/register', async(req,res)=>{
  try{
    const{email,password,firstName,lastName,role,company}=req.body;
    if(await prisma.user.findUnique({where:{email}})) return res.status(400).json({error:'Email déjà utilisé'});
    const ph=await bcrypt.hash(password,12);
    let co=null;
    if(company?.siret) co=await prisma.company.upsert({where:{siret:company.siret},update:{},create:{name:company.name,siret:company.siret,address:company.address,city:company.city,postalCode:company.postalCode,country:'FR'}});
    const u=await prisma.user.create({data:{email,passwordHash:ph,firstName,lastName,role:role||'CLIENT',status:'ACTIVE',companyId:co?.id}});
    if(role==='TRANSPORTEUR') await prisma.transporteurProfile.create({data:{userId:u.id}});
    const t=jwt.sign({id:u.id,email:u.email,role:u.role},JWT_SECRET,{expiresIn:'7d'});
    res.status(201).json({message:'Inscription réussie',accessToken:t,user:{id:u.id,email:u.email,firstName:u.firstName,lastName:u.lastName,role:u.role}});
  }catch(e){console.error('Register:',e);res.status(500).json({error:'Erreur serveur'});}
});

app.post('/api/auth/login', async(req,res)=>{
  try{
    const{email,password}=req.body;
    const u=await prisma.user.findUnique({where:{email},include:{company:true}});
    if(!u) return res.status(401).json({error:'Email ou mot de passe incorrect'});
    if(!await bcrypt.compare(password,u.passwordHash)) return res.status(401).json({error:'Email ou mot de passe incorrect'});
    if(u.status!=='ACTIVE') return res.status(403).json({error:'Compte non actif'});
    const t=jwt.sign({id:u.id,email:u.email,role:u.role},JWT_SECRET,{expiresIn:'7d'});
    await prisma.user.update({where:{id:u.id},data:{lastLoginAt:new Date()}});
    res.json({message:'Connexion réussie',accessToken:t,user:{id:u.id,email:u.email,firstName:u.firstName,lastName:u.lastName,role:u.role,company:u.company}});
  }catch(e){console.error('Login:',e);res.status(500).json({error:'Erreur serveur'});}
});

app.get('/api/auth/me',auth,async(req,res)=>{
  try{const u=await prisma.user.findUnique({where:{id:req.user.id},include:{company:true,transporteurProfile:{include:{vehicles:true}}}});res.json({user:u});}
  catch(e){res.status(500).json({error:'Erreur serveur'});}
});

// ── PRICING ──────────────────────────────────────────────────────────────

app.get('/api/pricing/vehicles',(req,res)=>res.json({vehicles:VEHICLES}));
app.get('/api/pricing/countries',(req,res)=>res.json({countries:COUNTRIES}));

app.post('/api/missions/quote',(req,res)=>{
  try{const p=calcPrice(req.body);res.json({quote:{...p,priceHTEuros:p.priceHT/100,priceTTCEuros:p.priceTTC/100}});}
  catch(e){res.status(500).json({error:'Erreur calcul'});}
});

// ── CARBON / GLEC ────────────────────────────────────────────────────────

app.post('/api/carbon/calculate',(req,res)=>{
  try{
    const{vehicleType,distanceKm,weightKg,fuelType,departureCountry}=req.body;
    if(!vehicleType||!distanceKm||!weightKg) return res.status(400).json({error:"vehicleType, distanceKm, weightKg requis"});
    const gt=V2G[vehicleType]; if(!gt) return res.status(400).json({error:`Type inconnu: ${vehicleType}`});
    const r=calcGLEC(vehicleType,distanceKm,weightKg,fuelType,departureCountry);
    res.json({success:true,methodology:{framework:"GLEC Framework v3.2",standard:"ISO 14083:2023",scope:"Well-to-Wheel",daf:GLEC.DAF,vehicleCategory:gt,fuelType:GLEC.fuels[fuelType||"diesel_b7"]?.l||"Diesel B7"},emissions:{totalCO2eKg:r.total,wtw:{total:r.total,ttw:r.ttw,wtt:r.wtt},intensity:{perTkm:r.perTkm,unit:"gCO2e/tkm"},rating:r.rating},legal:{iso14083:"ISO 14083:2023",glec:"GLEC Framework v3.2",euRegulation:"Règlement (UE) 2023/2832",frenchDecree:"Décret n°2017-639"},calculatedAt:new Date().toISOString()});
  }catch(e){console.error("CO2:",e);res.status(500).json({error:"Erreur calcul CO2"});}
});

app.get('/api/carbon/factors',(req,res)=>res.json({vehicleTypes:Object.entries(V2G).map(([v,g])=>({vehicleType:v,glecCategory:g,ef:GLEC.road[g]})),fuels:GLEC.fuels,electricityFactors:GLEC.elec,daf:GLEC.DAF}));

// ── MISSIONS ─────────────────────────────────────────────────────────────

app.get('/api/missions',auth,async(req,res)=>{
  try{
    const{status,page=1,limit=20}=req.query; const w={};
    if(req.user.role==='CLIENT') w.clientId=req.user.id;
    else if(req.user.role==='TRANSPORTEUR'){const p=await prisma.transporteurProfile.findUnique({where:{userId:req.user.id}});if(p) w.transporteurId=p.id;}
    if(status) w.status=status;
    const[m,t]=await Promise.all([prisma.mission.findMany({where:w,orderBy:{createdAt:'desc'},skip:(parseInt(page)-1)*parseInt(limit),take:parseInt(limit)}),prisma.mission.count({where:w})]);
    res.json({missions:m,total:t,page:parseInt(page),limit:parseInt(limit)});
  }catch(e){res.status(500).json({error:'Erreur serveur'});}
});

app.post('/api/missions',auth,async(req,res)=>{
  try{
    const d=req.body;
    const pc=CITIES[d.pickupCity]||{lat:48.8566,lon:2.3522}, dc=CITIES[d.deliveryCity]||{lat:45.4642,lon:9.19};
    const pLa=d.pickupLat||pc.lat, pLo=d.pickupLon||pc.lon, dLa=d.deliveryLat||dc.lat, dLo=d.deliveryLon||dc.lon;
    const pr=calcPrice({pickupLat:pLa,pickupLon:pLo,pickupCountry:d.pickupCountry||'FR',deliveryLat:dLa,deliveryLon:dLo,deliveryCountry:d.deliveryCountry||'FR',vehicleType:d.vehicleTypeRequired||'FOURGON_20M3',isUrgent:d.isUrgent||false,isWeekend:d.isWeekend||false,isNight:d.isNight||false,isADR:d.isADR||false,ecoOption:d.ecoOption||'standard'});
    const gl=calcGLEC(d.vehicleTypeRequired||'FOURGON_20M3',pr.distanceKm,d.weightKg||1000,d.fuelType,d.pickupCountry||'FR');
    const m=await prisma.mission.create({data:{
      client:{connect:{id:req.user.id}},reference:`TT-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
      status:d.enableBidding?'BIDDING':'PENDING',
      pickupAddress:d.pickupAddress,pickupCity:d.pickupCity,pickupPostalCode:d.pickupPostalCode,pickupCountry:d.pickupCountry||'FR',
      pickupLat:pLa,pickupLon:pLo,pickupContact:d.pickupContact||null,pickupPhone:d.pickupPhone||null,
      pickupDateRequested:d.pickupDateRequested?new Date(d.pickupDateRequested):null,
      deliveryAddress:d.deliveryAddress,deliveryCity:d.deliveryCity,deliveryPostalCode:d.deliveryPostalCode,deliveryCountry:d.deliveryCountry||'FR',
      deliveryLat:dLa,deliveryLon:dLo,deliveryContact:d.deliveryContact||null,deliveryPhone:d.deliveryPhone||null,
      deliveryDateRequested:d.deliveryDateRequested?new Date(d.deliveryDateRequested):null,
      goodsDescription:d.goodsDescription||null,weightKg:d.weightKg||1000,volumeM3:d.volumeM3||null,packagesCount:d.packagesCount||1,
      vehicleTypeRequired:d.vehicleTypeRequired||'FOURGON_20M3',
      isUrgent:d.isUrgent||false,isWeekend:d.isWeekend||false,isNight:d.isNight||false,isADR:d.isADR||false,isFragile:d.isFragile||false,ecoOption:d.ecoOption||'standard',
      distanceKm:pr.distanceKm,estimatedDurationHours:pr.estimatedHours,
      priceBase:pr.trinome.total,priceTolls:pr.tolls,priceSurcharges:pr.surcharges,priceEcoDiscount:pr.ecoDiscount,
      priceCommission:pr.commission,priceHT:pr.priceHT,priceTVA:pr.tva,priceTTC:pr.priceTTC,tvaRate:pr.tvaRate,
      co2Estimated:pr.co2Kg,ttScore:pr.ttScore,
      co2GlecWTW:gl?.total||null,co2GlecTTW:gl?.ttw||null,co2GlecWTT:gl?.wtt||null,co2Rating:gl?.rating||null,co2Methodology:gl?"GLEC v3 / ISO 14083":null,
      biddingDeadline:d.enableBidding?new Date(Date.now()+48*3600000):null,clientNotes:d.clientNotes,
    }});
    res.status(201).json({mission:m,price:pr,glec:gl});
  }catch(e){console.error('Create mission:',e);res.status(500).json({error:'Erreur création mission'});}
});

app.get('/api/missions/:id',auth,async(req,res)=>{
  try{
    const m=await prisma.mission.findUnique({where:{id:req.params.id},include:{
      client:{select:{id:true,email:true,firstName:true,lastName:true,company:true}},
      transporteur:{include:{user:{select:{firstName:true,lastName:true}}}},vehicle:true,
      bids:{include:{transporteur:{include:{user:{select:{firstName:true,lastName:true}}}}},orderBy:{amount:'asc'}},
      ratings:true,carbonReports:true,
    }});
    if(!m) return res.status(404).json({error:'Mission non trouvée'});
    res.json({mission:m});
  }catch(e){res.status(500).json({error:'Erreur serveur'});}
});

app.post('/api/missions/:id/accept',auth,async(req,res)=>{
  try{
    const m=await prisma.mission.findUnique({where:{id:req.params.id}});
    if(!m||!['PENDING','BIDDING'].includes(m.status)) return res.status(400).json({error:'Mission non disponible'});
    const p=await prisma.transporteurProfile.findUnique({where:{userId:req.user.id}});
    if(!p) return res.status(403).json({error:'Profil transporteur requis'});
    const u=await prisma.mission.update({where:{id:req.params.id},data:{transporteurId:p.id,vehicleId:req.body.vehicleId,status:'ACCEPTED',acceptedAt:new Date()}});
    await prisma.transporteurProfile.update({where:{id:p.id},data:{totalMissions:{increment:1}}});
    await prisma.notification.create({data:{userId:m.clientId,missionId:m.id,type:'MISSION_UPDATE',title:'Mission acceptée',message:`${m.reference} acceptée`}});
    res.json({mission:u,message:'Mission acceptée'});
  }catch(e){console.error('Accept:',e);res.status(500).json({error:'Erreur serveur'});}
});

app.post('/api/missions/:id/start',auth,async(req,res)=>{
  try{
    const m=await prisma.mission.findUnique({where:{id:req.params.id}});
    const u=await prisma.mission.update({where:{id:req.params.id},data:{status:'IN_TRANSIT',pickupDateActual:new Date()}});
    if(m) await prisma.notification.create({data:{userId:m.clientId,missionId:m.id,type:'MISSION_UPDATE',title:'En transit',message:`${m.reference} en transit`}});
    res.json({mission:u,message:'Mission démarrée'});
  }catch(e){res.status(500).json({error:'Erreur serveur'});}
});

app.post('/api/missions/:id/complete',auth,async(req,res)=>{
  try{
    const u=await prisma.mission.update({where:{id:req.params.id},data:{status:'DELIVERED',deliveryDateActual:new Date(),completedAt:new Date()}});
    if(u.transporteurId) await prisma.transporteurProfile.update({where:{id:u.transporteurId},data:{completedMissions:{increment:1}}});
    await prisma.notification.create({data:{userId:u.clientId,missionId:u.id,type:'DELIVERY_CONFIRMED',title:'Livré',message:`${u.reference} livré`}});
    res.json({mission:u,message:'Mission livrée'});
  }catch(e){res.status(500).json({error:'Erreur serveur'});}
});

// ── MARKETPLACE ──────────────────────────────────────────────────────────

app.get('/api/marketplace/missions',optAuth,async(req,res)=>{
  try{
    const{status="BIDDING",urgent,eco,adr,frigo,minDistance,maxDistance,minWeight,maxWeight,pickupCountry,deliveryCountry,sort="newest",page=1,limit=20,search}=req.query;
    const w={status};
    if(urgent==="true") w.isUrgent=true; if(adr==="true") w.isADR=true;
    if(frigo==="true") w.vehicleTypeRequired={contains:"FRIGO"};
    if(eco==="true") w.ecoOption={not:"standard"};
    if(minDistance) w.distanceKm={...(w.distanceKm||{}),gte:parseFloat(minDistance)};
    if(maxDistance) w.distanceKm={...(w.distanceKm||{}),lte:parseFloat(maxDistance)};
    if(minWeight) w.weightKg={...(w.weightKg||{}),gte:parseFloat(minWeight)};
    if(maxWeight) w.weightKg={...(w.weightKg||{}),lte:parseFloat(maxWeight)};
    if(pickupCountry) w.pickupCountry=pickupCountry; if(deliveryCountry) w.deliveryCountry=deliveryCountry;
    if(search) w.OR=[{reference:{contains:search,mode:'insensitive'}},{pickupCity:{contains:search,mode:'insensitive'}},{deliveryCity:{contains:search,mode:'insensitive'}},{goodsDescription:{contains:search,mode:'insensitive'}}];
    let ob={createdAt:'desc'};
    if(sort==="price_asc") ob={priceHT:'asc'}; if(sort==="price_desc") ob={priceHT:'desc'};
    if(sort==="distance") ob={distanceKm:'asc'}; if(sort==="weight") ob={weightKg:'desc'};
    const sk=(parseInt(page)-1)*parseInt(limit);
    const[ms,tot]=await Promise.all([prisma.mission.findMany({where:w,orderBy:ob,skip:sk,take:parseInt(limit),include:{client:{select:{firstName:true,lastName:true,company:{select:{name:true}}}},bids:{select:{id:true,amount:true,transporteurId:true,createdAt:true}}}}),prisma.mission.count({where:w})]);
    const data=ms.map(m=>({...m,co2Glec:m.co2GlecWTW?{totalKg:m.co2GlecWTW,rating:m.co2Rating}:null,bidsCount:m.bids?.length||0,bestBid:m.bids?.length?Math.min(...m.bids.map(b=>b.amount)):null}));
    res.json({success:true,data,pagination:{total:tot,page:parseInt(page),limit:parseInt(limit),totalPages:Math.ceil(tot/parseInt(limit))}});
  }catch(e){console.error("Marketplace:",e);res.status(500).json({error:"Erreur marketplace"});}
});

// ── BIDDING ──────────────────────────────────────────────────────────────

app.post('/api/marketplace/bid',auth,async(req,res)=>{
  try{
    const{missionId,amount,message,vehicleId,estimatedPickupDate}=req.body;
    if(!missionId||!amount) return res.status(400).json({error:"missionId et amount requis"});
    const m=await prisma.mission.findUnique({where:{id:missionId}});
    if(!m) return res.status(404).json({error:"Mission introuvable"});
    if(m.status!=="BIDDING") return res.status(400).json({error:"Non ouverte aux enchères"});
    const p=await prisma.transporteurProfile.findUnique({where:{userId:req.user.id},include:{user:true}});
    if(!p) return res.status(403).json({error:"Profil transporteur requis"});
    const b=await prisma.bid.create({data:{missionId,transporteurId:p.id,amount:parseInt(amount),message:message||null,vehicleId:vehicleId||null,estimatedPickupDate:estimatedPickupDate?new Date(estimatedPickupDate):null,status:"PENDING"}});
    await prisma.notification.create({data:{userId:m.clientId,type:"NEW_BID",missionId,title:"Nouvelle enchère",message:`${p.user?.firstName||"Transporteur"} a enchéri ${amount}€ sur ${m.reference}`}});
    res.json({success:true,data:b,message:`Enchère de ${amount}€ placée`});
  }catch(e){if(e.code==='P2002') return res.status(400).json({error:"Déjà enchéri"});console.error("Bid:",e);res.status(500).json({error:"Erreur enchère"});}
});

app.post('/api/marketplace/bid/:bidId/accept',auth,async(req,res)=>{
  try{
    const b=await prisma.bid.findUnique({where:{id:req.params.bidId},include:{mission:true,transporteur:true}});
    if(!b) return res.status(404).json({error:"Enchère introuvable"});
    if(b.mission.clientId!==req.user.id) return res.status(403).json({error:"Non autorisé"});
    await prisma.$transaction([
      prisma.bid.update({where:{id:b.id},data:{status:"ACCEPTED",respondedAt:new Date()}}),
      prisma.mission.update({where:{id:b.missionId},data:{status:"ACCEPTED",transporteurId:b.transporteurId,acceptedAt:new Date()}}),
      prisma.bid.updateMany({where:{missionId:b.missionId,id:{not:b.id}},data:{status:"REJECTED",respondedAt:new Date()}}),
      prisma.transporteurProfile.update({where:{id:b.transporteurId},data:{totalMissions:{increment:1}}}),
    ]);
    await prisma.notification.create({data:{userId:b.transporteur.userId,missionId:b.missionId,type:"BID_ACCEPTED",title:"Enchère acceptée",message:`Votre enchère de ${b.amount}€ acceptée`}});
    res.json({success:true,message:"Enchère acceptée"});
  }catch(e){console.error("Accept bid:",e);res.status(500).json({error:"Erreur"});}
});

app.get('/api/marketplace/bids/:missionId',auth,async(req,res)=>{
  try{
    const b=await prisma.bid.findMany({where:{missionId:req.params.missionId},include:{transporteur:{include:{user:{select:{firstName:true,lastName:true,company:{select:{name:true}}}}}}},orderBy:{amount:'asc'}});
    res.json({success:true,data:b});
  }catch(e){res.status(500).json({error:"Erreur"});}
});

// ── AI MATCHING ──────────────────────────────────────────────────────────

app.post('/api/marketplace/match',auth,async(req,res)=>{
  try{
    const{missionId}=req.body;
    const m=await prisma.mission.findUnique({where:{id:missionId}});
    if(!m) return res.status(404).json({error:"Mission introuvable"});
    const carriers=await prisma.transporteurProfile.findMany({where:{isVerified:true},include:{vehicles:true,user:{select:{firstName:true,lastName:true,company:{select:{name:true,city:true}}}}}});
    const scored=carriers.map(c=>{
      let s=0;const f=[];
      const hasCap=c.vehicles.some(v=>(VEHICLES[v.type]?.capacityKg||0)>=m.weightKg);
      const cap=hasCap?25:0;s+=cap;f.push({c:"capacity",s:cap,m:25});
      let prox=10;if(c.user?.company?.city&&m.pickupCity){prox=c.user.company.city.toLowerCase()===m.pickupCity.toLowerCase()?20:c.coverageRadius>=(m.distanceKm||500)?15:8;}
      s+=prox;f.push({c:"proximity",s:prox,m:20});
      const rat=Math.round((c.averageRating/5)*15);s+=rat;f.push({c:"rating",s:rat,m:15});
      let spec=15;if(m.isADR&&!c.hasADR) spec=0;if(m.vehicleTypeRequired?.includes("FRIGO")&&!c.hasFrigo) spec=0;
      s+=spec;f.push({c:"specialization",s:spec,m:15});
      const cr=c.totalMissions>0?c.completedMissions/c.totalMissions:0.5;
      const rel=Math.round(cr*10);s+=rel;f.push({c:"reliability",s:rel,m:10});
      const hasEco=c.vehicles.some(v=>v.fuelType==='electric'||v.fuelType==='hvo100');
      const eco=hasEco?10:5;s+=eco;f.push({c:"eco",s:eco,m:10});
      const exp=c.totalMissions>=100?5:c.totalMissions>=50?4:c.totalMissions>=20?3:1;
      s+=exp;f.push({c:"experience",s:exp,m:5});
      const tier=s>=85?"gold":s>=65?"silver":"bronze";
      return{transporteurId:c.id,name:c.user?.company?.name||`${c.user?.firstName} ${c.user?.lastName}`,matchScore:Math.min(100,s),tier,factors:f,rating:c.averageRating,totalMissions:c.totalMissions,badges:[c.averageRating>=4.8&&"⭐ Top 1%",c.completedMissions>=500&&"🏆 Expert",hasEco&&"🌿 Éco",cr>=0.98&&c.totalMissions>=100&&"⚡ Fiable"].filter(Boolean)};
    });
    scored.sort((a,b)=>b.matchScore-a.matchScore);
    res.json({success:true,mission:{id:m.id,reference:m.reference,route:`${m.pickupCity} → ${m.deliveryCity}`},matches:scored,algorithm:{version:"v3.0",criteria:7,maxScore:100}});
  }catch(e){console.error("Match:",e);res.status(500).json({error:"Erreur matching"});}
});

// ── RATINGS ──────────────────────────────────────────────────────────────

app.post('/api/ratings',auth,async(req,res)=>{
  try{
    const{missionId,score,comment,criteria}=req.body;
    if(!missionId||!score||score<1||score>5) return res.status(400).json({error:"missionId et score (1-5) requis"});
    const m=await prisma.mission.findUnique({where:{id:missionId}});
    if(!m||!m.transporteurId) return res.status(400).json({error:"Mission invalide"});
    const r=await prisma.rating.create({data:{missionId,fromUserId:req.user.id,toTransporteurId:m.transporteurId,score:parseInt(score),comment:comment||null,punctuality:criteria?.punctuality||null,communication:criteria?.communication||null,cargoHandling:criteria?.cargoHandling||null,professionalism:criteria?.professionalism||null}});
    const all=await prisma.rating.findMany({where:{toTransporteurId:m.transporteurId},select:{score:true}});
    const avg=all.reduce((s,r)=>s+r.score,0)/all.length;
    await prisma.transporteurProfile.update({where:{id:m.transporteurId},data:{averageRating:Math.round(avg*10)/10}});
    const tp=await prisma.transporteurProfile.findUnique({where:{id:m.transporteurId}});
    if(tp) await prisma.notification.create({data:{userId:tp.userId,missionId,type:"RATING_RECEIVED",title:"Nouvelle note",message:`${score}/5 pour ${m.reference}`}});
    res.json({success:true,data:r});
  }catch(e){if(e.code==='P2002') return res.status(400).json({error:"Déjà noté"});console.error("Rating:",e);res.status(500).json({error:"Erreur notation"});}
});

app.get('/api/ratings/:transporteurId',async(req,res)=>{
  try{const r=await prisma.rating.findMany({where:{toTransporteurId:req.params.transporteurId},include:{fromUser:{select:{firstName:true,lastName:true}},mission:{select:{reference:true,pickupCity:true,deliveryCity:true}}},orderBy:{createdAt:'desc'},take:50});res.json({success:true,data:r});}
  catch(e){res.status(500).json({error:"Erreur"});}
});

// ── NOTIFICATIONS ────────────────────────────────────────────────────────

app.get('/api/notifications',auth,async(req,res)=>{
  try{
    const{unreadOnly="false",limit=20}=req.query; const w={userId:req.user.id};
    if(unreadOnly==="true") w.read=false;
    const[n,uc]=await Promise.all([prisma.notification.findMany({where:w,orderBy:{createdAt:'desc'},take:parseInt(limit)}),prisma.notification.count({where:{userId:req.user.id,read:false}})]);
    res.json({success:true,data:n,unreadCount:uc});
  }catch(e){res.status(500).json({error:"Erreur notifications"});}
});

app.post('/api/notifications/read',auth,async(req,res)=>{
  try{
    const{notificationIds}=req.body;
    if(notificationIds?.length) await prisma.notification.updateMany({where:{id:{in:notificationIds},userId:req.user.id},data:{read:true}});
    else await prisma.notification.updateMany({where:{userId:req.user.id,read:false},data:{read:true}});
    res.json({success:true});
  }catch(e){res.status(500).json({error:"Erreur"});}
});

// ── ADMIN ────────────────────────────────────────────────────────────────

app.get('/api/admin/stats',auth,async(req,res)=>{
  try{
    if(!['ADMIN','SUPER_ADMIN'].includes(req.user.role)) return res.status(403).json({error:'Accès refusé'});
    const[uc,mc,tc,bc,rc]=await Promise.all([prisma.user.count(),prisma.mission.count(),prisma.transporteurProfile.count(),prisma.bid.count(),prisma.rating.count()]);
    const cm=await prisma.mission.findMany({where:{status:{in:['DELIVERED','COMPLETED']}},select:{priceTTC:true,co2GlecWTW:true}});
    const rev=cm.reduce((s,m)=>s+m.priceTTC,0), co2=cm.reduce((s,m)=>s+(m.co2GlecWTW||0),0);
    res.json({stats:{usersCount:uc,missionsCount:mc,transporteursCount:tc,bidsCount:bc,ratingsCount:rc,totalRevenue:rev/100,totalCommission:(rev*0.1)/100,totalCO2Kg:Math.round(co2*10)/10}});
  }catch(e){res.status(500).json({error:'Erreur serveur'});}
});

app.get('/api/admin/users',auth,async(req,res)=>{
  try{if(!['ADMIN','SUPER_ADMIN'].includes(req.user.role)) return res.status(403).json({error:'Accès refusé'});const u=await prisma.user.findMany({include:{company:true},orderBy:{createdAt:'desc'}});res.json({users:u});}
  catch(e){res.status(500).json({error:'Erreur serveur'});}
});

app.get('/api/admin/missions',auth,async(req,res)=>{
  try{if(!['ADMIN','SUPER_ADMIN'].includes(req.user.role)) return res.status(403).json({error:'Accès refusé'});const m=await prisma.mission.findMany({include:{client:{select:{email:true,firstName:true,lastName:true}},bids:{select:{id:true}}},orderBy:{createdAt:'desc'},take:100});res.json({missions:m});}
  catch(e){res.status(500).json({error:'Erreur serveur'});}
});

// ── TRACKING ─────────────────────────────────────────────────────────────

app.get('/api/tracking/:reference',async(req,res)=>{
  try{
    const m=await prisma.mission.findFirst({where:{OR:[{id:req.params.reference},{reference:req.params.reference}]},include:{transporteur:{include:{user:{select:{firstName:true,lastName:true,phone:true}}}},vehicle:true}});
    if(!m) return res.status(404).json({error:'Non trouvée'});
    let prog=0;const sp={PENDING:0,BIDDING:5,ACCEPTED:10,IN_TRANSIT:50,DELIVERED:100,COMPLETED:100};prog=sp[m.status]||0;
    if(m.status==='IN_TRANSIT'&&m.pickupDateActual){const s=new Date(m.pickupDateActual).getTime(),d=(m.estimatedDurationHours||8)*3600000;prog=Math.min(95,10+((Date.now()-s)/d)*85);}
    res.json({tracking:{reference:m.reference,status:m.status,progress:Math.round(prog),pickup:{city:m.pickupCity,country:m.pickupCountry},delivery:{city:m.deliveryCity,country:m.deliveryCountry},co2:m.co2GlecWTW?{totalKg:m.co2GlecWTW,rating:m.co2Rating}:null}});
  }catch(e){res.status(500).json({error:'Erreur serveur'});}
});

// ── TRANSPORTEUR ─────────────────────────────────────────────────────────

app.get('/api/transporteur/stats',auth,async(req,res)=>{
  try{
    if(req.user.role!=='TRANSPORTEUR') return res.status(403).json({error:'Accès transporteur requis'});
    const p=await prisma.transporteurProfile.findUnique({where:{userId:req.user.id},include:{vehicles:true}});
    if(!p) return res.status(404).json({error:'Profil non trouvé'});
    const ms=await prisma.mission.findMany({where:{transporteurId:p.id}});
    const rev=ms.filter(m=>['DELIVERED','COMPLETED'].includes(m.status)).reduce((s,m)=>s+m.priceTTC,0);
    const[bc,rc]=await Promise.all([prisma.bid.count({where:{transporteurId:p.id}}),prisma.rating.count({where:{toTransporteurId:p.id}})]);
    res.json({stats:{totalMissions:p.totalMissions,completedMissions:p.completedMissions,averageRating:p.averageRating,isVerified:p.isVerified,totalRevenue:rev/100,netRevenue:(rev*0.9)/100,vehiclesCount:p.vehicles.length,bidsCount:bc,ratingsCount:rc,activeMissions:ms.filter(m=>['ACCEPTED','IN_TRANSIT'].includes(m.status)).length},vehicles:p.vehicles});
  }catch(e){res.status(500).json({error:'Erreur serveur'});}
});

app.get('/api/transporteur/missions',auth,async(req,res)=>{
  try{const p=await prisma.transporteurProfile.findUnique({where:{userId:req.user.id}});if(!p) return res.status(404).json({error:'Non trouvé'});const m=await prisma.mission.findMany({where:{transporteurId:p.id},orderBy:{createdAt:'desc'},include:{client:{select:{firstName:true,lastName:true,company:true}},vehicle:true}});res.json({missions:m});}
  catch(e){res.status(500).json({error:'Erreur serveur'});}
});

app.get('/api/transporteur/available',auth,async(req,res)=>{
  try{const m=await prisma.mission.findMany({where:{status:{in:['PENDING','BIDDING']},transporteurId:null},orderBy:[{isUrgent:'desc'},{createdAt:'desc'}],include:{client:{select:{firstName:true,lastName:true,company:{select:{name:true}}}},bids:{select:{id:true}}},take:50});res.json({missions:m});}
  catch(e){res.status(500).json({error:'Erreur serveur'});}
});

app.get('/api/missions/available/list',auth,async(req,res)=>{
  try{const m=await prisma.mission.findMany({where:{status:{in:['PENDING','BIDDING']},transporteurId:null},orderBy:[{isUrgent:'desc'},{createdAt:'desc'}],take:50});res.json({missions:m});}
  catch(e){res.status(500).json({error:'Erreur serveur'});}
});

// ═══════════════════════════════════════════════════════════════════════════
// START
// ═══════════════════════════════════════════════════════════════════════════

app.listen(PORT,'0.0.0.0',()=>{
  console.log('');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('🚛 TRANSPORT TOKEN API v3.0');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`   🌐 http://localhost:${PORT}`);
  console.log('   📍 AUTH · MISSIONS · MARKETPLACE · BIDDING · MATCHING');
  console.log('   📍 CARBON/GLEC · RATINGS · NOTIFICATIONS · TRACKING · ADMIN');
  console.log('═══════════════════════════════════════════════════════════════');
});
