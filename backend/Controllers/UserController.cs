using backend.Entities;
using backend.Data;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using backend.Dtos;

namespace backend.Controllers;

[ApiController]
[Route("api/user")]
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
        var user = await _userManager.GetUserAsync(User);
        if (user == null)
            return Unauthorized();

        return Ok(new {
            // user.Country,
            // user.FirstName,
            // user.LastName,
            user.UserName,
            user.Email,
            user.ConsentData,
            user.ConsentSuggestions
        });
    }

    [HttpPatch("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateUserProfileDto dto)
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null)
            return Unauthorized();

        // Aggiornamento Username ed Email
        if (!string.IsNullOrWhiteSpace(dto.Username))
            user.UserName = dto.Username;
        if (!string.IsNullOrWhiteSpace(dto.Email))
            user.Email = dto.Email;

        if (dto.ConsentData.HasValue)
            user.ConsentData = dto.ConsentData.Value;

        if (dto.ConsentSuggestions.HasValue)
            user.ConsentSuggestions = dto.ConsentSuggestions.Value;


        // Cambiamento password se non è presente
        if (string.IsNullOrWhiteSpace(user.PasswordHash))
        {
            if (!string.IsNullOrWhiteSpace(dto.NewPassword))
            {
                var addPasswordResult = await _userManager.AddPasswordAsync(user, dto.NewPassword);
                if (!addPasswordResult.Succeeded)
                    return BadRequest(addPasswordResult.Errors);
            }
        }
        // Cambiamento password se sono presenti entrambi i campi
        if (!string.IsNullOrWhiteSpace(dto.OldPassword) && !string.IsNullOrWhiteSpace(dto.NewPassword))
        {
            var passwordChangeResult = await _userManager.ChangePasswordAsync(user, dto.OldPassword, dto.NewPassword);

            if (!passwordChangeResult.Succeeded)
                return BadRequest(passwordChangeResult.Errors);
        }

        var result = await _userManager.UpdateAsync(user);
        if (!result.Succeeded)
            return BadRequest(result.Errors);

        return Ok(new { message = "Profile updated successfully" });
    }

    [HttpDelete("profile")]
    public async Task<IActionResult> DeleteAccount()
    {
        var user = await _userManager.GetUserAsync(User);
        if (user == null)
            return Unauthorized();

        var result = await _userManager.DeleteAsync(user);
        if (!result.Succeeded)
            return BadRequest(result.Errors);

        return Ok(new { message = "Account deleted successfully" });
    }
}

