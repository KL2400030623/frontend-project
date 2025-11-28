import { useState, useRef } from 'react'

const MAX_FILE_BYTES = 5 * 1024 * 1024 // 5MB
const ALLOWED_EXT = ['pdf','doc','docx','png','jpg','jpeg']

export default function StudentFeedback(){
  const [name, setName] = useState('')
  const [course, setCourse] = useState('')
  const [rating, setRating] = useState('')
  const [comments, setComments] = useState('')
  const [fileInfo, setFileInfo] = useState(null)
  const [errors, setErrors] = useState({})
  const [success, setSuccess] = useState(false)
  const fileRef = useRef(null)

  function clearErrors(){ setErrors({}) }

  function validate(){
    const errs = {}
    if(!name.trim()) errs.name = 'Please enter your full name.'
    if(!course) errs.course = 'Please select a course.'
    if(!rating) errs.rating = 'Please select a rating between 1 and 5.'
    if(!comments || comments.trim().length < 10) errs.comments = 'Please write at least 10 characters.'

    const f = fileRef.current && fileRef.current.files && fileRef.current.files[0]
    if(f){
      if(f.size > MAX_FILE_BYTES) errs.file = 'File is too large (max 5MB).'
      const ext = (f.name || '').split('.').pop().toLowerCase()
      if(!ALLOWED_EXT.includes(ext)) errs.file = 'Unsupported file type. Allowed: pdf, doc, docx, png, jpg.'
    }

    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  function handleFileChange(e){
    const f = e.target.files && e.target.files[0]
    if(!f){ setFileInfo(null); return }
    setFileInfo({ name: f.name, size: f.size, type: f.type })
  }

  function resetForm(){
    setName('')
    setCourse('')
    setRating('')
    setComments('')
    setFileInfo(null)
    if(fileRef.current) fileRef.current.value = ''
  }

  function handleSubmit(e){
    e.preventDefault()
    clearErrors()
    setSuccess(false)

    if(!validate()) return

    const data = {
      name: name.trim(),
      course,
      rating,
      comments: comments.trim(),
      file: fileInfo || null
    }

    // Log a shallow copy with file metadata to the console
    console.log('Feedback submitted (client):', data)

    // Display success message
    setSuccess(true)
    // clear form after a short delay so user can see the success message
    setTimeout(()=>{
      resetForm()
      setSuccess(false)
    }, 1200)
  }

  function randomize(autoSubmit){
    const names = ['Alice Park','Bob Smith','Carla Jones','Daniel Lee','Eva Kim','Frank Zhao']
    const commentsSamples = [
      'Great course! Learned a lot and enjoyed the projects.',
      'Could use more real-world examples, but instructor was helpful.',
      'Pace was quick but manageable; more office hours would help.',
      'I liked the labs and exercises. Thanks!',
      'The course content was clear and well-structured.'
    ]
    const pick = (arr)=>arr[Math.floor(Math.random()*arr.length)]

    setName(pick(names))
    setCourse('CS 301')
    setRating(String(Math.floor(Math.random()*5)+1))
    setComments(pick(commentsSamples))
    if(fileRef.current) fileRef.current.value = ''

    if(autoSubmit){
      setTimeout(()=>{
        const form = document.getElementById('student-feedback-form')
        if(form) form.requestSubmit ? form.requestSubmit() : form.querySelector('button[type=submit]').click()
      }, 350)
    }
  }

  return (
    <div className="sf-wrapper">
      <div className={"sf-success" + (success ? ' visible' : '')} role="status" aria-live="polite">Thanks — your feedback was submitted successfully.</div>

      <form id="student-feedback-form" className="sf-form" onSubmit={handleSubmit} noValidate>
        <div className="sf-row">
          <div className="sf-col">
            <label htmlFor="sf-name">Full name *</label>
            <input id="sf-name" value={name} onChange={e=>setName(e.target.value)} placeholder="Your full name" />
            {errors.name && <div className="sf-error">{errors.name}</div>}
          </div>

          <div className="sf-col">
            <label htmlFor="sf-course">Course *</label>
            <select id="sf-course" value={course} onChange={e=>setCourse(e.target.value)}>
              <option value="">-- Select course --</option>
              <option>Math 101</option>
              <option>History 201</option>
              <option>CS 301</option>
              <option>Physics 102</option>
            </select>
            {errors.course && <div className="sf-error">{errors.course}</div>}
          </div>
        </div>

        <div className="sf-row">
          <div className="sf-col">
            <label htmlFor="sf-rating">Rating (1-5) *</label>
            <select id="sf-rating" value={rating} onChange={e=>setRating(e.target.value)}>
              <option value="">-- Select rating --</option>
              <option value="1">1 - Poor</option>
              <option value="2">2 - Fair</option>
              <option value="3">3 - Good</option>
              <option value="4">4 - Very good</option>
              <option value="5">5 - Excellent</option>
            </select>
            {errors.rating && <div className="sf-error">{errors.rating}</div>}
          </div>

          <div className="sf-col">
            <label htmlFor="sf-file">Attach file (optional)</label>
            <input id="sf-file" ref={fileRef} type="file" accept=".pdf,.doc,.docx,.png,.jpg,.jpeg" onChange={handleFileChange} />
            {fileInfo && <div className="sf-hint">Selected: {fileInfo.name} ({Math.round(fileInfo.size/1024)} KB)</div>}
            {errors.file && <div className="sf-error">{errors.file}</div>}
          </div>
        </div>

        <div style={{marginBottom:12}}>
          <label htmlFor="sf-comments">Comments *</label>
          <textarea id="sf-comments" value={comments} onChange={e=>setComments(e.target.value)} placeholder="Write your comments (min 10 characters)" />
          {errors.comments && <div className="sf-error">{errors.comments}</div>}
        </div>

        <div className="sf-actions">
          <button type="submit">Submit feedback</button>
          <button type="button" onClick={()=>randomize(true)} className="sf-secondary">Randomize</button>
          <div className="sf-hint">Fields marked * are required</div>
        </div>
      </form>
    </div>
  )
}
