using Microsoft.AspNetCore.Identity;

namespace backend.Entities;

public class User : IdentityUser<int>
{
    // Campi aggiuntivi (custom)
    public string? Provider { get; set; }
    public string? ProviderId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public ICollection<Review> Reviews { get; set; } = new List<Review>();
}