import { Component, OnInit, OnDestroy, NgModule } from '@angular/core';
import { AppService } from '../app.service';
import { Subscription } from 'rxjs';
import { finalize, switchMap, tap } from 'rxjs/operators';
import { TranslateService } from '@ngx-translate/core';
import { CloudAppEventsService, PageInfo, EntityType, CloudAppRestService, FormGroupUtil, AlertService } from '@exlibris/exl-cloudapp-angular-lib';
import { Bib, BibUtils } from './bib-utils';
import { marker as _ } from '@biesbjerg/ngx-translate-extract-marker';


@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.scss']
})
export class MainComponent implements OnInit, OnDestroy {

  private pageLoad$: Subscription;
  private bibUtils: BibUtils;
  bib: Bib;
  running = false;
  subField810a: string;

  constructor(
    private appService: AppService,
    private eventsService: CloudAppEventsService,
    private restService: CloudAppRestService,
    private translate: TranslateService,
    private alert: AlertService
  ) { }

  ngOnInit() {
    this.bibUtils = new BibUtils(this.restService);
    this.eventsService.getInitData().subscribe(data=> {
      this.translate.use(data.lang);
    });

    this.pageLoad$ = this.eventsService.onPageLoad((pageInfo: PageInfo) => {
      const entities = (pageInfo.entities||[]).filter(e=>[EntityType.BIB_MMS, 'IEP', 'BIB','AUTHORITY_MMS'].includes(e.type));
      if (entities.length > 0) {
        this.bibUtils.getBib(entities[0].id).subscribe(bib=> {
          this.bib = (bib.record_format=='cnmarc' || bib.record_format == 'unimarc') ? bib : null;
          if(this.bib){
            this.subField810a = this.bibUtils.generate810a(this.bib);
          }
        })
      } else {
        this.bib = null;      
      }
    });
  }

  ngOnDestroy(): void {
    this.pageLoad$.unsubscribe();
  }

  updateFieldContent() {
    try {
      //hack method to get the editor iframe and find the correct place to update content
      var yards_iframe = <HTMLIFrameElement>window.parent.document.getElementById("yardsNgWrapper");
      var editors = (<HTMLIFrameElement>yards_iframe.contentWindow.document.getElementById('yards_iframe'))
                  .contentWindow.document.getElementsByClassName('marcEditor mainContainer autoHeight');
      var authEditor = editors[1];
      if(authEditor === undefined){
        this.alert.error(this.translate.instant('i18n.NoAuthorityRecord'));
        return;
      }
  
      var textareas = authEditor.getElementsByTagName("textarea");
      for(let i = 0 ; i < textareas.length; i ++){
        if(textareas[i].parentElement.parentElement.parentElement.id == "MarcEditorPresenter.textArea.810"){
          if(textareas[i].value.trim().endsWith("a")){
            textareas[i].value = textareas[i].value + this.subField810a;
            textareas[i].click();
            this.alert.success(this.translate.instant('i18n.UpdateSuccess'));
            break;
          }else{
            if (!confirm(this.translate.instant('i18n.UpdateConfirm',{title:this.bib.title, mmid: this.bib.mms_id }))) return;
            textareas[i].value = textareas[i].value.substr(0,3) + this.subField810a;
            textareas[i].click();
            this.alert.success(this.translate.instant('i18n.UpdateSuccess'));
            break;
          }
        }
      }         
    } catch (error) {
      this.alert.error(this.translate.instant('i18n.NoAuthorityRecord'));
    }
  }
}