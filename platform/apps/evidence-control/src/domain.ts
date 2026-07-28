export interface Evidence{source:string;geography:string;published_at:string;expires_at:string;confidence:"low"|"medium"|"high";limitations:string[];approved:boolean;}
export function canDraft(e:Evidence,now:string){return e.approved&&e.source.length>0&&e.geography.length>0&&e.limitations.length>0&&Date.parse(e.published_at)<=Date.parse(now)&&Date.parse(e.expires_at)>Date.parse(now);}
