
namespace backend.Dtos;

public class UpdateUserProfileDto
{
    public string? Username { get; set; }
    public string? Email { get; set; }
    public string? OldPassword { get; set; }
    public string? NewPassword { get; set; }
}
