import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
// @ts-ignore
import GitHubCalendar from 'github-calendar';
import { finalize } from 'rxjs';

interface GeoData {
  city: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule, MatToolbarModule, MatCardModule, MatProgressSpinnerModule, MatSnackBarModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, AfterViewInit {
  @ViewChild('calendarContainer') calendarEl!: ElementRef;

  repoOwner = 'advancedor96';
  repo = 'udemy_1007';
  loading = false;
  message = '';
  error = '';
  isTodayClicked = false;
  geo: GeoData = { city: ''};
  lastCheckin = '';

  constructor(private http: HttpClient, private snackBar: MatSnackBar) {}

  ngAfterViewInit() {
    console.log('View is ready');
    GitHubCalendar(this.calendarEl.nativeElement, 'advancedor96', {
      responsive: true,  // 讓它適應容器大小
      tooltips: false,    // 滑鼠懸停顯示細節
      global_stats: false // 顯示總計、連續貢獻等統計
    });
    
    // 添加這段：等 calendar 載入完成後，自動捲動到最右邊
    setTimeout(() => {
      const calendarElement = this.calendarEl.nativeElement.querySelector('.js-calendar-graph > div');
      if (calendarElement) {
        calendarElement.scrollLeft = calendarElement.scrollWidth;
      } else {
        console.log('找不到目標元素');
      }
    }, 1000);  // 給一些時間讓日曆完全載入
  }

  ngOnInit() {
    this.getLastCheckin();
    this.getGeoLocation();
  }

  // getTodayStr(): string {
  //   const d = new Date();
  //   return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
  // }



  lastCheckinDisplay(): string {
    // 如果沒有資料，直接返回空字串
    if (!this.lastCheckin) return '';

    // 用正則表達式同時抓取日期和城市，格式為 YYYY-MM-DD(city,)
    const match = this.lastCheckin.match(/^(\d{4})-(\d{2})-(\d{2})\(([^,]+),/);
    if (!match) return this.lastCheckin;

    // 解構賦值，取得年月日和城市
    const [, year, month, day, city] = match;
    
    // 創建日期物件來取得星期幾
    const date = new Date(`${year}-${month}-${day}`);
    
    // 星期幾的中文表示
    const weekDays = ['日', '一', '二', '三', '四', '五', '六'];
    const weekDay = weekDays[date.getDay()];

    // 格式化為 "M/D(星期x), city"
    return `${parseInt(month)}/${parseInt(day)}(${weekDay}), ${city}`;
  }

  getLastCheckin() {
    this.loading = true;
    this.http.get<any>('https://proj-expired-1111.duckdns.org/getLastCheckin').pipe(
      finalize(() => {
      this.loading = false;
      })
    )
    .subscribe({
      next: (response) => {
      // 在這裡先 log 出完整的回應
        console.log('Raw 完整的回應:', response);
        this.lastCheckin = response.lastLine || '';

        const lastCheckinDate = response.lastDate.split(' ')[0];

        const warsawDate = new Intl.DateTimeFormat('en-CA', {
          timeZone: 'Europe/Warsaw',
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        }).format(new Date());
        console.log('當下時間:', warsawDate);
        this.isTodayClicked = (warsawDate === lastCheckinDate);


      },
      error: (error) => {
        console.error('Error:', error);
        if (error?.status === 401) {
          alert('GitHub Token 失效或權限不足');
          this.lastCheckin = 'GitHub Token 失效或權限不足';
        } else {
          this.lastCheckin = '查詢失敗';
        }
      }
    });
  }

  getGeoLocation() {
    this.http.get<GeoData>('https://ipapi.co/json/').subscribe({
      next: (data) => {
        this.geo.city = data.city;
      },
      error: () => {
        this.geo = { city: ''};
      }
    });
  }



  updateFile() {
    if (this.loading) return;
    console.log('再次執行');
    this.loading = true;
    this.message = '';
    this.error = '';

    const data = {
      city: this.geo.city || '',
    };

    this.http.post<any>('https://proj-expired-1111.duckdns.org/updateFile', data).subscribe({
      next: (response) => {
        this.message = response.message;
        this.snackBar.open('打卡成功！', '關閉', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
        this.isTodayClicked = true;
        this.getLastCheckin();
      },
      error: (error) => {
        this.error = 'Failed to commit: ' + (error.error?.statusMessage || error.message);
        this.snackBar.open(this.error, '關閉', {
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}