using backend.Entities;
using backend.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using backend.Dtos;

namespace backend.Controllers;

[ApiController]
[Route("user")]
[Authorize]
public class UserController : ControllerBase
{
    private readonly UserManager<User> _userManager;

    public UserController(UserManager<User> userManager)
    {
        _userManager = userManager;
    }

    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var user = await GetCurrentUserAsync();
        if (user == null)
            return Unauthorized();

        return Ok(new {
            user.UserName,
            user.Email
            // altri campi pubblici del profilo
        });
    }

    [HttpPatch("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateUserProfileDto dto)
    {
        var user = await GetCurrentUserAsync();
        if (user == null)
            return Unauthorized();

        // Aggiornamento Username ed Email
        if (!string.IsNullOrWhiteSpace(dto.Username))
            user.UserName = dto.Username;
        if (!string.IsNullOrWhiteSpace(dto.Email))
            user.Email = dto.Email;

        // Cambiamento password se sono presenti entrambi i campi
        if (!string.IsNullOrWhiteSpace(dto.OldPassword) && !string.IsNullOrWhiteSpace(dto.NewPassword))
        {
            var passwordChangeResult = await _userManager.ChangePasswordAsync(user, dto.OldPassword, dto.NewPassword);

            if (!passwordChangeResult.Succeeded)
                return BadRequest(passwordChangeResult.Errors);
        }
        else if (!string.IsNullOrWhiteSpace(dto.NewPassword) || !string.IsNullOrWhiteSpace(dto.OldPassword))
        {
            // Se è presente solo uno dei due, mostra errore
            return BadRequest(new { message = "Both old and new passwords are required to change the password." });
        }

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
            return BadRequest(result.Errors);

        return Ok(new { message = "Profile updated successfully" });
    }

    [HttpDelete("profile")]
    public async Task<IActionResult> DeleteAccount()
    {
        var user = await GetCurrentUserAsync();
        if (user == null)
            return Unauthorized();

        var result = await _userManager.DeleteAsync(user);
        if (!result.Succeeded)
            return BadRequest(result.Errors);

        return Ok(new { message = "Account deleted successfully" });
    }
    private Task<User?> GetCurrentUserAsync()
    {
        var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        return _userManager.FindByIdAsync(userId!);
    }
}

