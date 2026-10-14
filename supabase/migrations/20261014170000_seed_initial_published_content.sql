-- Seed the website's built-in content into shared Supabase storage.
-- Idempotent: only fill blank hero fields and add missing products/gallery entries.

insert into public.hero_slides
(slide_number,title,subtitle,badge,image_url,button_text,button_url,is_published,draft_data,updated_at)
values
(1,'FURNITURE THAT COMPLETES YOUR SPACE.','Discover furniture designed to bring comfort, character and style into your home.','Mastercrafted Living Spaces','https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1920&q=85','Explore Collections','/collections',true,jsonb_build_object('title','FURNITURE THAT COMPLETES YOUR SPACE.','subtitle','Discover furniture designed to bring comfort, character and style into your home.','badge','Mastercrafted Living Spaces','image_url','https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1920&q=85','button_text','Explore Collections','button_url','/collections'),now()),
(2,'TIMELESS ELEGANCE FOR EVERY ROOM.','From luxurious sectional sofas to refined bedroom suites crafted for absolute relaxation.','Signature Living Sets','https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1920&q=85','Contact Us','/contact',true,jsonb_build_object('title','TIMELESS ELEGANCE FOR EVERY ROOM.','subtitle','From luxurious sectional sofas to refined bedroom suites crafted for absolute relaxation.','badge','Signature Living Sets','image_url','https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1920&q=85','button_text','Contact Us','button_url','/contact'),now()),
(3,'BESPOKE CUSTOM FURNITURE.','Tailored to your precise dimensions, aesthetic preferences, and lifestyle needs.','Custom Craftsmanship','https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=1920&q=85','Explore Collections','/collections',true,jsonb_build_object('title','BESPOKE CUSTOM FURNITURE.','subtitle','Tailored to your precise dimensions, aesthetic preferences, and lifestyle needs.','badge','Custom Craftsmanship','image_url','https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=1920&q=85','button_text','Explore Collections','button_url','/collections'),now())
on conflict(slide_number) do update set
title=case when btrim(public.hero_slides.title)='' then excluded.title else public.hero_slides.title end,
subtitle=case when btrim(public.hero_slides.subtitle)='' then excluded.subtitle else public.hero_slides.subtitle end,
badge=case when btrim(public.hero_slides.badge)='' then excluded.badge else public.hero_slides.badge end,
image_url=case when btrim(public.hero_slides.image_url)='' then excluded.image_url else public.hero_slides.image_url end,
button_text=case when btrim(public.hero_slides.button_text)='' then excluded.button_text else public.hero_slides.button_text end,
button_url=case when btrim(public.hero_slides.button_url)='' then excluded.button_url else public.hero_slides.button_url end,
is_published=case when btrim(public.hero_slides.title)='' or btrim(public.hero_slides.image_url)='' then true else public.hero_slides.is_published end,
draft_data=case when btrim(public.hero_slides.title)='' or btrim(public.hero_slides.image_url)='' then excluded.draft_data else public.hero_slides.draft_data end,
updated_at=now();

update public.site_settings set
business_name=case when btrim(business_name)='' or business_name='TATARI' then 'Tatari Furniture' else business_name end,
tagline=case when btrim(tagline)='' then 'Furniture That Completes Your Space.' else tagline end,
address=case when btrim(address)='' then '179 Dogon Karfi, Jos, Plateau State, Nigeria' else address end,
phone=case when btrim(phone)='' then '0803 217 4376' else phone end,
phone_international=case when btrim(phone_international)='' then '+2348032174376' else phone_international end,
whatsapp_url=case when btrim(whatsapp_url)='' then 'https://wa.me/2348032174376' else whatsapp_url end,
map_url=case when btrim(map_url)='' then 'https://maps.google.com/?q=179+Dogon+Karfi+Jos+Plateau+State+Nigeria' else map_url end,
description=case when btrim(description)='' then 'A premier furniture store serving customers in Jos and beyond with exquisite craftsmanship, comfort, and timeless interior elegance.' else description end,
editorial_image_url=case when btrim(editorial_image_url)='' then 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1000&q=85' else editorial_image_url end,
is_published=true,updated_at=now() where id='main';

update public.site_settings set draft_data=jsonb_build_object(
'logo_url',logo_url,'business_name',business_name,'tagline',tagline,'address',address,'phone',phone,
'phone_international',phone_international,'whatsapp_url',whatsapp_url,'map_url',map_url,
'description',description,'editorial_image_url',editorial_image_url) where id='main';

insert into public.products(name,category,category_label,image_url,description,features,dimensions,materials,is_published,sort_order)
select x.name,x.category,x.category_label,x.image_url,x.description,x.features::jsonb,x.dimensions,x.materials,true,x.sort_order
from (values
('The Royal Executive Sectional Sofa','living-room','Living Room','https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=85','Plush, deep-seated sectional sofa upholstered in premium fabric with high-density cushioning designed for luxurious family gatherings and formal reception.','["High-density foam core","Stain-resistant textured upholstery","Solid kiln-dried hardwood frame"]','','Premium Velvet & Hardwood',0),
('Aosta Modern Velvet 3-Seater','living-room','Living Room','https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1200&q=85','An iconic silhouette featuring elegant tufted detailing and tapered wooden legs. Built to anchor any contemporary living room with sophistication.','["Ergonomic lumbar support","Reinforced corner blocking","Custom color options available"]','','Soft Bouclé Fabric & Walnut Wood',1),
('Dogon Karfi Center Table Set','living-room','Living Room','https://images.unsplash.com/photo-1533779283484-8ab4940aa78f?auto=format&fit=crop&w=1200&q=85','A harmonious nested coffee table and side table combination featuring rich walnut finishes and brushed gold accents.','["Scratch-resistant polished top","Nesting modular versatility","Sturdy metallic base"]','','Solid Walnut & Brushed Brass',2),
('Jos Grand Accent Armchair','living-room','Living Room','https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=85','A statement armchair offering generous seating depth and wrap-around backrest support for ultimate reading or relaxation.','["360-degree smooth swivel base (optional)","Plush feather-blend cushion insert"]','','Woven Linen & Dark Walnut',3),
('Plateau Imperial King Bed Frame','bedroom','Bedroom','https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=85','A majestic upholstered headboard with vertical channel tufting, creating a tranquil and luxurious focal point for your master bedroom.','["Heavy-duty slat support system","Sound-dampening silent frame construction","Compatible with all standard mattresses"]','','Upholstered Fabric & African Mahogany',4),
('Sanctuary 6-Door Wardrobe','bedroom','Bedroom','https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=85','Spacious wardrobe featuring multi-compartment shelving, hanging rails, and soft-close mirrored doors for effortless bedroom organization.','["Full-length dressing mirrors","Lockable jewellery drawers","Integrated LED wardrobe lighting"]','','Engineered Wood & Mirrored Glass',5),
('Minimalist Walnut Bedside Dresser','bedroom','Bedroom','https://images.unsplash.com/photo-1532372320572-cda25653a26d?auto=format&fit=crop&w=1200&q=85','Sleek two-drawer bedside table designed with clean lines and smooth gliding drawers for night-time essentials.','["Soft-close drawer mechanism","Durable water-resistant finish"]','','Walnut Veneer',6),
('Custom Executive Office Suite','custom','Custom Furniture','https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=85','Tailored executive desk and matching credenza designed to elevate private home studies and corporate boardrooms.','["Integrated cable management","Customizable dimensions","Hand-finished timber grain"]','','Selected Hardwoods',7),
('Bespoke Dining Table & Chairs','custom','Custom Furniture','https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=1200&q=85','Custom-built dining set tailored to seat your family and guests comfortably, crafted with durability and unforgettable aesthetics in mind.','["Seats 6 to 12 guests","Custom stain finishes available"]','','Solid Mahogany & Upholstered Leather',8),
('Console & Entryway Credenza','other','Other Furniture','https://images.unsplash.com/photo-1595428774223-ef52624120d2?auto=format&fit=crop&w=1200&q=85','An elegant slimline console table designed for grand entryways, hallways, or behind living room sofas.','["Slim profile for compact spaces","Durable display surface"]','','Oak & Brushed Metal',9),
('Lounge Ottoman & Footstool','other','Other Furniture','https://images.unsplash.com/photo-1567016432779-094069958ea5?auto=format&fit=crop&w=1200&q=85','Versatile upholstered ottoman that doubles as extra seating or a comfortable footrest.','["Multi-functional use","Lightweight and portable"]','','Textured Fabric',10)
) as x(name,category,category_label,image_url,description,features,dimensions,materials,sort_order)
where not exists(select 1 from public.products p where p.name=x.name);

insert into public.gallery_items(title,category,image_url,description,is_published,sort_order)
select x.title,x.category,x.image_url,x.description,true,x.sort_order
from (values
('Luxury Living Room Display','Living Room','https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?auto=format&fit=crop&w=1200&q=85','An expansive living room layout featuring our signature sectional sofa and ambient lighting in Jos.',0),
('Master Bedroom Suite','Bedroom','https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=85','Serene bedroom setup showcasing the Plateau Imperial king bed and matching nightstands.',1),
('Showroom Interior Walkthrough','Showroom','https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=1200&q=85','A glimpse inside our showroom at 179 Dogon Karfi, displaying our curated collections.',2),
('Bespoke Dining Craftsmanship','Furniture','https://images.unsplash.com/photo-1615066390971-03e4e1c36ddf?auto=format&fit=crop&w=1200&q=85','Detailed view of our custom dining table construction highlighting natural wood textures.',3),
('Modern Executive Office','Interiors','https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=1200&q=85','Custom executive office furniture solution crafted for professional productivity.',4),
('Contemporary Seating Arrangement','Living Room','https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?auto=format&fit=crop&w=1200&q=85','Stylish armchair pairing creating a cozy nook for relaxation.',5),
('Wardrobe & Storage Detail','Bedroom','https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=85','High-capacity wardrobe integration designed for modern residential needs.',6),
('Showroom Ambiance','Showroom','https://images.unsplash.com/photo-1538688525198-9b88f6f53126?auto=format&fit=crop&w=1200&q=85','Warm lighting and elegant furniture arrangements welcoming visitors in Jos.',7)
) as x(title,category,image_url,description,sort_order)
where not exists(select 1 from public.gallery_items g where g.title=x.title);
