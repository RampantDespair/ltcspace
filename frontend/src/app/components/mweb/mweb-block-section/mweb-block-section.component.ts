import { ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MwebApiService } from '@app/services/mweb-api.service';
import { MwebBlockResponse } from '@interfaces/mweb.interface';

@Component({
  selector: 'app-mweb-block-section',
  templateUrl: './mweb-block-section.component.html',
  styleUrls: ['./mweb-block-section.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: false,
})
export class MwebBlockSectionComponent implements OnChanges {
  @Input() blockHash: string;

  mweb$: Observable<MwebBlockResponse | null>;

  constructor(private mwebApi: MwebApiService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['blockHash'] && this.blockHash) {
      this.mweb$ = this.mwebApi.getBlock$(this.blockHash).pipe(
        catchError(() => of(null)),
      );
    }
  }
}
