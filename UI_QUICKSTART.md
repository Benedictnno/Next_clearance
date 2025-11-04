# UI Quick Start Guide

## 🚀 Access Points

### For Students
```
Dashboard: /student/dashboard
  → Click "Start Workflow" banner (top)
  → OR "Office Clearance Workflow" in Quick Actions (sidebar)

Direct Link: /student/clearance-workflow
```

### For Officers
```
Dashboard: /officer/dashboard
  → Click "Open Workflow Dashboard" banner (top)

Direct Link: /officer/clearance-workflow
```

---

## 🎓 Student Interface

### Main Features

**1. Office Status View**
- See all 7 offices at once
- Color-coded status (green/yellow/red/gray)
- Progress bar shows completion %

**2. Submit Documents**
- Click "Submit" button on any office
- Upload multiple files (drag-drop or click)
- Add/remove files before submitting
- Click "Submit Documents" when ready

**3. Track Progress**
- Sidebar shows overall % complete
- See breakdown: Approved/Pending/Not Started
- "Download Clearance Forms" appears when 100%

**4. Handle Rejections**
- Rejected offices show red badge
- View officer's reason/comment
- Click "Resubmit" to upload new documents

---

## 👨‍💼 Officer Interface

### Main Features

**1. Select Office**
- 7 office buttons at top
- Click to view that office's submissions
- Selected office highlighted in blue

**2. View Statistics**
- 4 cards: Total, Pending, Approved, Rejected
- Updates in real-time

**3. Toggle View Mode**
- "Pending" - shows only pending submissions
- "All Submissions" - shows complete history

**4. Review Submissions**
- Each card shows:
  - Student name & matric number
  - Status badge
  - Submission time
  - Document links (click to view)
- Click "Approve" or "Reject" buttons

**5. Take Action**
- **Approve**: Add optional comment
- **Reject**: Must provide reason
- Click "Approve"/"Reject" to confirm

---

## 📋 Seven Offices

| # | Office ID | Office Name |
|---|-----------|-------------|
| 1 | `faculty_library` | Faculty Library |
| 2 | `sports_directorate` | Sports Directorate |
| 3 | `hostel_management` | Hostel Management |
| 4 | `student_affairs` | Student Affairs |
| 5 | `department_hod` | Department (HOD) |
| 6 | `faculty_dean` | Faculty (Dean) |
| 7 | `bursary` | Bursary |

---

## 🎨 Status Colors

| Status | Color | Icon | Meaning |
|--------|-------|------|---------|
| Not Started | Gray | ○ | No documents submitted yet |
| Pending | Yellow | ⏳ | Documents submitted, awaiting review |
| Approved | Green | ✓ | Officer approved |
| Rejected | Red | ✗ | Officer rejected, can resubmit |

---

## 📸 UI Screenshots Guide

### Student Dashboard
```
┌─────────────────────────────────────────────────────┐
│ 🎯 New: Office Clearance Workflow                  │
│ Submit documents to 7 offices...  [Start Workflow] │
└─────────────────────────────────────────────────────┘
```

### Student Workflow Page
```
┌─────────────────────────────────────────────┐
│ Seven Clearance Offices                      │
├─────────────────────────────────────────────┤
│ ✓ 1. Faculty Library         [APPROVED]     │
│ ⏳ 2. Sports Directorate      [PENDING]      │
│ ○ 3. Hostel Management        [Submit]       │
│ ✗ 4. Student Affairs          [Resubmit]    │
│ ○ 5. Department (HOD)         [Submit]       │
│ ○ 6. Faculty (Dean)           [Submit]       │
│ ○ 7. Bursary                  [Submit]       │
└─────────────────────────────────────────────┘
```

### Officer Dashboard
```
┌─────────────────────────────────────────────────────┐
│ 📋 New Office Clearance Workflow                    │
│ Review office-specific...  [Open Workflow Dashboard]│
└─────────────────────────────────────────────────────┘
```

### Officer Workflow Page
```
┌─────────────────────────────────────────────────────┐
│ Select Office:                                       │
│ [Library] [Sports] [Hostel] [Affairs] [HOD] [Dean]  │
│ [Bursary]                                           │
├─────────────────────────────────────────────────────┤
│ Total: 100  Pending: 25  Approved: 70  Rejected: 5 │
├─────────────────────────────────────────────────────┤
│ [Pending (25)] [All Submissions (100)]   [Refresh]  │
├─────────────────────────────────────────────────────┤
│ Student: John Doe (CSC/2020/001)     [✓ Approve]   │
│ Status: PENDING | Submitted: 2h ago  [✗ Reject]    │
│ Documents: library_form.pdf                          │
└─────────────────────────────────────────────────────┘
```

---

## ⚡ Quick Actions

### As Student
| Action | How To |
|--------|--------|
| Start workflow | Click banner on dashboard |
| Submit documents | Click "Submit" → Upload → "Submit Documents" |
| Check progress | Look at sidebar progress bar |
| Resubmit rejected | Click "Resubmit" on red office card |
| Download forms | Click "Download Clearance Forms" when 100% |

### As Officer
| Action | How To |
|--------|--------|
| Open workflow | Click banner on dashboard |
| Switch office | Click office button at top |
| View pending | Click "Pending" toggle |
| Approve | Click "✓ Approve" → Add comment → "Approve" |
| Reject | Click "✗ Reject" → Add reason → "Reject" |
| View document | Click blue document link |

---

## 🔧 Troubleshooting

### Common Issues

**"Upload failed"**
- Check file size (max 10MB)
- Check file type (PDF, JPG, PNG, DOC only)
- Check internet connection

**"No submissions found"**
- Make sure correct office is selected
- Try toggling "Pending"/"All Submissions"
- Click "Refresh" button

**"Submission already reviewed"**
- This submission was already approved/rejected
- Refresh page to see updated list

**Progress not updating**
- Click "🔄 Refresh Status"
- Check notifications for updates

---

## 💡 Pro Tips

### For Students
1. **Upload all required documents at once** - saves time
2. **Check notifications regularly** - get instant feedback
3. **Read rejection comments carefully** - helps avoid second rejection
4. **Start early** - don't wait until all offices open
5. **Keep copies** - save documents before uploading

### For Officers
1. **Use office selector efficiently** - keyboard navigation works
2. **Filter with view modes** - focus on pending first
3. **Add detailed comments** - helps students understand
4. **Provide specific rejection reasons** - avoids back-and-forth
5. **Check document quality** - zoom in on files if needed

---

## 📱 Mobile Experience

### Optimized For
- ✅ Touch-friendly buttons
- ✅ Responsive layouts
- ✅ Readable on small screens
- ✅ Swipe-friendly navigation

### Best Practices
- Use portrait mode for office list
- Use landscape for document viewing
- Tap and hold for preview options

---

## 🎯 Success Indicators

### Student
- Green checkmarks on all 7 offices
- 100% progress bar
- "All Approved!" message
- "Download Clearance Forms" button appears

### Officer
- Pending count decreases
- Approved count increases
- Statistics update immediately
- Empty state shows "No pending submissions"

---

## 🔗 Related Pages

- **API Documentation**: `CLEARANCE_WORKFLOW_DOCS.md`
- **System Overview**: `CLEARANCE_WORKFLOW_SUMMARY.md`
- **Quick Reference**: `CLEARANCE_WORKFLOW_QUICKREF.md`
- **Frontend Details**: `FRONTEND_UPDATES.md`

---

## ⌨️ Keyboard Shortcuts (Desktop)

| Key | Action |
|-----|--------|
| `Tab` | Navigate between elements |
| `Enter` | Activate buttons |
| `Esc` | Close modals |
| `Space` | Select files in upload |

---

## 📞 Need Help?

1. Check the documentation files listed above
2. Review inline tooltips in the UI
3. Check browser console for errors
4. Contact system administrator

---

**Quick Start Complete!** 🎉

You're ready to use the clearance workflow system. Navigate to your dashboard and click the banner to get started!
