using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SapBasisPulse.Api.DTOs;
using SapBasisPulse.Api.Services;

namespace SapBasisPulse.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;

        public UsersController(IUserService userService)
        {
            _userService = userService;
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetAll()
        {
            var users = await _userService.GetAllAsync();
            return Ok(users);
        }

        [HttpGet("consultants")]
        [Authorize]
        public async Task<IActionResult> GetAllConsultants()
        {
            var users = await _userService.GetConsultantUsersWithRatingsAsync();
            return Ok(users);
        }

        [HttpGet("{id}")]
        [Authorize]
        public async Task<IActionResult> GetById(Guid id)
        {
            var user = await _userService.GetByIdAsync(id);
            if (user == null) return NotFound();
            return Ok(user);
        }

        [HttpPost]
        [AllowAnonymous]
        public async Task<IActionResult> Create([FromBody] CreateUserDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var (success, error, user) = await _userService.CreateAsync(dto);
            if (!success) return BadRequest(new { error });
            return CreatedAtAction(nameof(GetById), new { id = user!.Id }, user);
        }

        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> Update(Guid id, [FromBody] UpdateUserDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var (success, error, user) = await _userService.UpdateAsync(id, dto);
            if (!success) return BadRequest(new { error });
            return Ok(user);
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> Delete(Guid id)
        {
            var (success, error) = await _userService.DeleteAsync(id);
            if (!success) return BadRequest(new { error });
            return NoContent();
        }

        [HttpPut("{id}/hourly-rate")]
        [Authorize(Roles = "Consultant")]
        public async Task<IActionResult> UpdateHourlyRate(Guid id, [FromBody] UpdateHourlyRateDto dto)
        {
            if (!ModelState.IsValid) return BadRequest(ModelState);

            // Ensure user can only update their own rate
            var userId = Guid.Parse(User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value ?? "");
            if (id != userId) return Forbid();

            var (success, error) = await _userService.UpdateHourlyRateAsync(id, dto.HourlyRate);
            if (!success) return BadRequest(new { error });
            return Ok(new { message = "Hourly rate updated successfully" });
        }
    }

    public class UpdateHourlyRateDto
    {
        public decimal HourlyRate { get; set; }
    }
}