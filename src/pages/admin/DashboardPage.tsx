import React, { useMemo } from 'react';
import ReactECharts from 'echarts-for-react';
import { useAttendanceData } from '../../hooks/useAttendanceData';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Users, UserCheck, UserX, Clock, Info } from 'lucide-react';
import { useFilterStore } from '../../store/useFilterStore';

const InfoTooltip = ({ text }: { text: string }) => (
  <div className="group relative inline-flex items-center justify-center ml-2 align-middle">
    <Info className="w-4 h-4 text-slate-400 hover:text-slate-600 cursor-help transition-colors" />
    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block w-56 p-2.5 bg-slate-800 text-white text-xs rounded-lg shadow-xl z-50 text-center pointer-events-none font-normal leading-relaxed">
      {text}
      <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-800"></div>
    </div>
  </div>
);

export default function DashboardPage() {
  const { data, isLoading } = useAttendanceData();
  const { month, year } = useFilterStore();

  const metrics = useMemo(() => {
    let totalHadir = 0;
    let totalSakit = 0;
    let totalIzin = 0;
    let totalAlpha = 0;

    data.forEach(emp => {
      totalHadir += emp.summary.hadir;
      totalSakit += emp.summary.sakit;
      totalIzin += emp.summary.izin;
      totalAlpha += emp.summary.alpha;
    });

    return { totalHadir, totalSakit, totalIzin, totalAlpha };
  }, [data]);

  const lineChartOption = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const xAxisData = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    const seriesData = xAxisData.map(day => {
      let count = 0;
      data.forEach(emp => {
        const record = emp.records.find(r => r.date === day);
        if (record && record.status === 'Hadir') count++;
      });
      return count;
    });

    return {
      tooltip: { trigger: 'axis' },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', boundaryGap: false, data: xAxisData },
      yAxis: { type: 'value' },
      series: [
        {
          name: 'Hadir',
          type: 'line',
          smooth: true,
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [{ offset: 0, color: 'rgba(16, 185, 129, 0.5)' }, { offset: 1, color: 'rgba(16, 185, 129, 0.05)' }]
            }
          },
          itemStyle: { color: '#10b981' },
          data: seriesData
        }
      ]
    };
  }, [data, month, year]);

  const donutChartOption = useMemo(() => {
    return {
      tooltip: { trigger: 'item' },
      legend: { top: '5%', left: 'center' },
      series: [
        {
          name: 'Rasio Presensi',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: { show: false, position: 'center' },
          emphasis: {
            label: { show: true, fontSize: 20, fontWeight: 'bold' }
          },
          labelLine: { show: false },
          data: [
            { value: metrics.totalHadir, name: 'Hadir', itemStyle: { color: '#10b981' } },
            { value: metrics.totalSakit, name: 'Sakit', itemStyle: { color: '#f59e0b' } },
            { value: metrics.totalIzin, name: 'Izin', itemStyle: { color: '#3b82f6' } },
            { value: metrics.totalAlpha, name: 'Alpha', itemStyle: { color: '#ef4444' } }
          ]
        }
      ]
    };
  }, [metrics]);

  const heatmapOption = useMemo(() => {
    const daysInMonth = new Date(year, month, 0).getDate();
    const heatmapData: [number, number, number][] = [];
    
    // Sort data by most 'Hadir' to make it a true "Top 10 Ranking"
    const sortedData = [...data].sort((a, b) => b.summary.hadir - a.summary.hadir);
    
    // Y-axis: Employees (limit to 10 for display)
    const displayData = sortedData.slice(0, 10);
    const yAxisData = displayData.map(emp => emp.name);
    const xAxisData = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    displayData.forEach((emp, yIndex) => {
      emp.records.forEach(record => {
        let val = 0;
        if (record.status === 'Hadir') val = 1;
        else if (record.status === 'Sakit' || record.status === 'Izin') val = 0.5;
        heatmapData.push([record.date - 1, yIndex, val]);
      });
    });

    return {
      tooltip: { 
        position: 'top',
        formatter: function (params: any) {
          const date = params.value[0] + 1;
          const empName = yAxisData[params.value[1]];
          const val = params.value[2];
          
          let status = 'Alpha/Libur';
          let color = '#ef4444';
          if (val === 1) {
            status = 'Hadir';
            color = '#10b981';
          } else if (val === 0.5) {
            status = 'Sakit/Izin';
            color = '#f59e0b';
          }

          return `<div style="font-family: Inter, sans-serif; padding: 4px;">
                    <div style="font-weight: 600; margin-bottom: 4px; color: #0f172a;">${empName}</div>
                    <div style="color: #64748b; font-size: 12px;">Tanggal ${date} &nbsp;|&nbsp; <span style="color: ${color}; font-weight: 600;">${status}</span></div>
                  </div>`;
        }
      },
      grid: { height: '70%', top: '10%' },
      xAxis: { type: 'category', data: xAxisData, splitArea: { show: true } },
      yAxis: { 
        type: 'category', 
        data: yAxisData, 
        splitArea: { show: true }, 
        inverse: true,
        axisLabel: { width: 80, overflow: 'truncate' }
      },
      visualMap: {
        min: 0, max: 1, calculable: true, orient: 'horizontal', left: 'center', bottom: '0%',
        inRange: { color: ['#f1f5f9', '#6ee7b7', '#10b981'] },
        text: ['Hadir', 'Alpha/Libur'],
        textStyle: { color: '#64748b', fontSize: 12 }
      },
      series: [{
        name: 'Kehadiran', type: 'heatmap', data: heatmapData,
        label: { show: false },
        emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' } }
      }]
    };
  }, [data, month, year]);

  if (isLoading) {
    return <div className="flex items-center justify-center h-full">Loading data...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Top Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center">
              Total Hadir
              <InfoTooltip text="Jumlah pegawai yang melakukan presensi masuk dan pulang pada bulan ini." />
            </CardTitle>
            <UserCheck className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{metrics.totalHadir}</div>
            <p className="text-xs text-emerald-600 font-medium mt-1">+2.5% dari bulan lalu</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center">
              Total Sakit
              <InfoTooltip text="Jumlah pegawai yang melampirkan keterangan sakit resmi." />
            </CardTitle>
            <Clock className="w-4 h-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{metrics.totalSakit}</div>
            <p className="text-xs text-slate-500 mt-1">-1.2% dari bulan lalu</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center">
              Total Izin
              <InfoTooltip text="Jumlah pegawai yang melampirkan keterangan izin." />
            </CardTitle>
            <Users className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{metrics.totalIzin}</div>
            <p className="text-xs text-slate-500 mt-1">Sama seperti bulan lalu</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 flex items-center">
              Total Alpha
              <InfoTooltip text="Jumlah pegawai yang tidak hadir tanpa keterangan (bolos)." />
            </CardTitle>
            <UserX className="w-4 h-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-900">{metrics.totalAlpha}</div>
            <p className="text-xs text-red-600 font-medium mt-1">+0.5% dari bulan lalu</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center">
              Tren Kehadiran Harian
              <InfoTooltip text="Grafik jumlah kehadiran pegawai dari hari ke hari selama satu bulan berjalan." />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReactECharts option={lineChartOption} style={{ height: '300px' }} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              Rasio Presensi
              <InfoTooltip text="Perbandingan persentase status kehadiran seluruh pegawai pada bulan ini." />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ReactECharts option={donutChartOption} style={{ height: '300px' }} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            Distribusi Kepadatan Absensi (Top 10 Kehadiran)
            <InfoTooltip text="Peta visual (Heatmap) riwayat presensi 10 pegawai dengan tingkat kehadiran tertinggi bulan ini. Hijau gelap = Hadir, Hijau muda = Izin/Sakit, Abu-abu = Alpha/Libur. Arahkan kursor ke kotak untuk melihat detail." />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ReactECharts option={heatmapOption} style={{ height: '400px' }} />
        </CardContent>
      </Card>
    </div>
  );
}
