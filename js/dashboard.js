let paymentsChartInstance = null;

function renderPaymentsChart(totalPaid, totalContract) {

  const ctx = document.getElementById("paymentsChart");
  if (!ctx) return;

  if (paymentsChartInstance) {
    paymentsChartInstance.destroy();
  }

  const restante = Math.max(totalContract - totalPaid, 0);
  const percent = totalContract > 0
    ? Math.round((totalPaid / totalContract) * 100)
    : 0;

  // 🎨 Palette Dark Finanziaria
  let mainColor = "#00f5a0"; // verde neon soft
  if (percent < 100 && percent >= 50) mainColor = "#00c6ff"; // blu premium
  if (percent < 50) mainColor = "#ff3d71"; // rosso elegante

  paymentsChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Pagato', 'Restante'],
      datasets: [{
        data: [totalPaid, restante],
        backgroundColor: [
          mainColor,
          "rgba(255,255,255,0.06)"
        ],
        borderWidth: 0
      }]
    },
    options: {
      cutout: "78%",
      responsive: true,
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          backgroundColor: "#0f0f0f",
          borderColor: "#222",
          borderWidth: 1,
          titleColor: "#fff",
          bodyColor: "#ccc",
          padding: 12,
          callbacks: {
            label: function(context) {
              return context.label + ": € " + context.raw;
            }
          }
        }
      },
      animation: {
        animateRotate: true,
        duration: 1400,
        easing: 'easeOutQuart'
      }
    },
    plugins: [{
      id: 'centerText',
      beforeDraw(chart) {

        const { width, height } = chart;
        const ctx = chart.ctx;

        ctx.save();

        // Glow effetto premium
        ctx.shadowColor = mainColor;
        ctx.shadowBlur = 20;

        ctx.font = "bold 36px sans-serif";
        ctx.fillStyle = mainColor;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(percent + "%", width / 2, height / 2 - 10);

        ctx.shadowBlur = 0;

        ctx.font = "14px sans-serif";
        ctx.fillStyle = "#888";
        ctx.fillText("Completamento", width / 2, height / 2 + 20);

        ctx.restore();
      }
    }]
  });
}
