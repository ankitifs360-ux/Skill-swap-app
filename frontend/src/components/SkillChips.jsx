function SkillChips({ skills = [], emptyText = "No skills added yet" }) {
  if (!skills.length) {
    return <span className="muted-text">{emptyText}</span>;
  }

  return (
    <div className="chip-list">
      {skills.map((skill, index) => (
        <span key={`${skill}-${index}`} className="skill-chip">
          {skill}
        </span>
      ))}
    </div>
  );
}

export default SkillChips;
