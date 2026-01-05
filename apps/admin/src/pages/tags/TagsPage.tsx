import DashboardLayout from '../../components/dashboard-layout/DashboardLayout'
import './tags-page.css'

function TagsPage() {
  return (
    <DashboardLayout>
      <section className="tags-card">
        <div className="card-label">标签管理</div>
        <div className="tags-title">标签管理建设中</div>
        <div className="tags-note">后续可在此维护标签与分类。</div>
      </section>
    </DashboardLayout>
  )
}

export default TagsPage
