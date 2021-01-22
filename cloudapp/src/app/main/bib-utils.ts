import { CloudAppRestService, HttpMethod } from "@exlibris/exl-cloudapp-angular-lib";
import { Observable } from "rxjs";
import { map } from "rxjs/operators";

export interface Bib {
  link: string,
  mms_id: string;
  title: string;
  author: string;
  record_format: string;
  linked_record_id: string;
  anies: any;
}

export class BibUtils {
  private _restService: CloudAppRestService;

  constructor(restService: CloudAppRestService) {
    this._restService = restService;
  }

  /** Retrieve a single BIB record */
  getBib (mmsId: string): Observable<Bib> {
    return this._restService.call(`/bibs/${mmsId}`);
  }   

  getAuthority(mmsId:string = '981021751138603966' ): Observable<any> {
    console.log('search for authority id=' + mmsId);
    return this._restService.call(`/bibs/authorities/${mmsId}`);
  }

  generate810a(bib: Bib) : string {
    const doc = new DOMParser().parseFromString(bib.anies, "application/xml");
    let _f : string;
    var _200 = this.getField("200",doc);
    var _200a = this.getSubField("a",_200);
    var _200e = this.getSubField("e",_200);
    var _210 = this.getField("210",doc);
    var _210a = this.getSubField("a",_210);
    var _210c = this.getSubField("c",_210);
    var _210d = this.getSubField("d",_210);
    _f = _200a;
    if(_200e)
      _f += " : " +  _200e;
    if(_210a)
      _f += "," +  _210a;
    if(_210c)
      _f += "," +  _210c;
    if(_210d)
      _f += "," +  _210d;
   return _f;
  }

  private getField(tag:string, doc: Document): any {
    let _f : any;
    Array.from(doc.getElementsByTagName("datafield")).forEach( datafield => {
      if( tag == datafield.getAttribute("tag")) {
        _f = datafield;
      }
    });
    return _f;
  }

  private getSubField(tag:string, datafield:Element): string {
    let _sf : string 
    Array.from(datafield.getElementsByTagName("subfield")).forEach(subfield => {
      if(tag == subfield.getAttribute("code")){
        _sf = subfield.textContent;          
      }
    });
    return _sf;
  }

  /** Update a BIB record with the specified MARCXML */
  updateBib( bib: Bib ): Observable<Bib> {
    return this._restService.call( {
      url: `/bibs/${bib.mms_id}`,
      headers: { 
        "Content-Type": "application/xml",
        Accept: "application/json" },
      requestBody: `<bib>${bib.anies}</bib>`,
      method: HttpMethod.PUT
    });
  }      
}
