using Microsoft.AspNetCore.Mvc;
using SapBasisPulse.Api.DTOs;
using SapBasisPulse.Api.Entities;
using SapBasisPulse.Api.Services;
using System.Linq;

namespace SapBasisPulse.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]

        public class AuthController : ControllerBase
        {
            private readonly IAuthService _authService;
            private readonly IConfiguration _configuration;

            public AuthController(IAuthService authService, IConfiguration configuration)
            {
                _authService = authService;
                _configuration = configuration;
            }

            [HttpGet("consultant-registration-status")]
            public IActionResult GetConsultantRegistrationStatus()
            {
                bool isEnabled = _configuration.GetSection("Auth")["ConsultantRegistrationEnabled"]?.ToLower() == "true";
                return Ok(new { isEnabled });
            }

            [HttpGet("messaging-status")]
            public IActionResult GetMessagingStatus()
            {
                bool isEnabled = _configuration.GetSection("Auth")["MessagingEnabled"]?.ToLower() == "true";
                return Ok(new { isEnabled });
            }



        [HttpPost("confirm-email")]
        public async Task<IActionResult> ConfirmEmail([FromBody] ConfirmEmailDto dto)
        {
            (bool success, string? error) = await _authService.ConfirmEmailAsync(dto.Token);
            if (!success) return BadRequest(new { error });
            return Ok(new { message = "Email confirmed" });
        }


        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto dto)
        {
            try
            {
                // Detailed validation and debugging
                if (!ModelState.IsValid)
                {
                    var errors = ModelState.SelectMany(x => x.Value.Errors.Select(e => new 
                    { 
                        Field = x.Key, 
                        Error = e.ErrorMessage 
                    })).ToList();
                    
                    return BadRequest(new 
                    { 
                        error = "Validation failed", 
                        details = errors,
                        receivedData = new 
                        {
                            Email = dto?.Email,
                            FirstName = dto?.FirstName,
                            LastName = dto?.LastName,
                            Role = dto?.Role,
                            PasswordLength = dto?.Password?.Length ?? 0
                        }
                    });
                }

                // Normalize role to proper case
                if (!string.IsNullOrEmpty(dto.Role))
                {
                    dto.Role = char.ToUpper(dto.Role[0]) + dto.Role.Substring(1).ToLower();
                }

                (bool success, string? error, object? response) = await _authService.RegisterAsync(dto);
                
                if (!success) 
                {
                    return BadRequest(new 
                    { 
                        error = error ?? "Registration failed",
                        timestamp = DateTime.UtcNow,
                        requestData = new 
                        {
                            Email = dto.Email,
                            Role = dto.Role,
                            FirstName = dto.FirstName,
                            LastName = dto.LastName
                        }
                    });
                }
                
                return Ok(response);
            }
            catch (Exception ex)
            {
                // Detailed exception information for debugging
                return StatusCode(500, new 
                { 
                    error = "Internal server error during registration",
                    message = ex.Message,
                    stackTrace = ex.StackTrace,
                    innerException = ex.InnerException?.Message,
                    timestamp = DateTime.UtcNow,
                    requestData = new 
                    {
                        Email = dto?.Email,
                        Role = dto?.Role,
                        FirstName = dto?.FirstName,
                        LastName = dto?.LastName,
                        PasswordProvided = !string.IsNullOrEmpty(dto?.Password)
                    }
                });
            }
        }


        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            (bool success, string? error, object? response) = await _authService.LoginAsync(dto);
            if (!success) return BadRequest(new { error });
            return Ok(response);
        }


        [HttpPost("google-sso")]
        public async Task<IActionResult> GoogleSso([FromBody] SsoRequestDto dto)
        {
            (bool success, string? error, object? response) = await _authService.GoogleSsoAsync(dto.IdToken);
            if (!success) return BadRequest(new { error });
            return Ok(response);
        }


        [HttpPost("apple-sso")]
        public async Task<IActionResult> AppleSso([FromBody] SsoRequestDto dto)
        {
            (bool success, string? error, object? response) = await _authService.AppleSsoAsync(dto.IdToken);
            if (!success) return BadRequest(new { error });
            return Ok(response);
        }


        [HttpPost("refresh-token")]
        public async Task<IActionResult> RefreshToken([FromBody] string refreshToken)
        {
            (bool success, string? error, object? response) = await _authService.RefreshTokenAsync(refreshToken);
            if (!success) return BadRequest(new { error });
            return Ok(response);
        }
    }
}