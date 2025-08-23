import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface GeoData {
  city: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
  repoOwner = 'advancedor96';
  repo = 'udemy_1007';
  loading = false;
  message = '';
  error = '';
  isTodayClicked = false;
  geo: GeoData = { city: ''};
  lastCheckin = '';

  constructor(private http: HttpClient) {}

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
    this.http.get<any>('/api/getLastCheckin').subscribe({
      next: (response) => {
        console.log('Last checkin:', response);
        this.lastCheckin = response.lastLine || '';

        // 檢查日期了
        const match = this.lastCheckin.match(/^(\d{4}-\d{2}-\d{2})/);
        if (match) {
          const lastCheckinDate = match[1];

          const today = new Date().toISOString().split('T')[0];
          
          // 比較日期
          this.isTodayClicked = (lastCheckinDate === today);
        } else {
          this.isTodayClicked = false;
        }
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
    if (this.loading ) return;

    this.loading = true;
    this.message = '';
    this.error = '';

    const data = {
      city: this.geo.city || '',
    };

    this.http.post<any>('/api/updateFile', data).subscribe({
      next: (response) => {
        console.log('Update response:', response);
        this.message = response.message;
        this.isTodayClicked = true;
        this.getLastCheckin();
      },
      error: (error) => {
        console.error('Error:', error);
        this.error = 'Failed to commit: ' + (error.error?.statusMessage || error.message);
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}